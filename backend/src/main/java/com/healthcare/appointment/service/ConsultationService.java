package com.healthcare.appointment.service;

import com.healthcare.appointment.dto.*;
import com.healthcare.appointment.entity.*;
import com.healthcare.appointment.exception.AppointmentStateException;
import com.healthcare.appointment.exception.ResourceNotFoundException;
import com.healthcare.appointment.mapper.EntityMapper;
import com.healthcare.appointment.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConsultationService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final AiSummaryService aiSummaryService;
    private final EntityMapper entityMapper;

    @Transactional(readOnly = true)
    public Page<AppointmentDto> getDoctorAppointments(String doctorEmail, AppointmentStatus status, LocalDate date, Pageable pageable) {
        Doctor doctor = doctorRepository.findByUserEmail(doctorEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        Page<Appointment> page;
        if (status != null) {
            page = appointmentRepository.findByDoctorIdAndStatusOrderByAppointmentDateDescStartTimeDesc(doctor.getId(), status, pageable);
        } else {
            page = appointmentRepository.findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(doctor.getId(), pageable);
        }

        return page.map(entityMapper::toAppointmentDto);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> getDoctorTodayAppointments(String doctorEmail) {
        Doctor doctor = doctorRepository.findByUserEmail(doctorEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        List<Appointment> list = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByStartTimeAsc(
            doctor.getId(), LocalDate.now()
        );
        return list.stream().map(entityMapper::toAppointmentDto).toList();
    }

    @Transactional(readOnly = true)
    public DoctorStatsDto getDoctorStats(String doctorEmail) {
        Doctor doctor = doctorRepository.findByUserEmail(doctorEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        long today = appointmentRepository.countByDoctorIdAndAppointmentDateAndStatus(
            doctor.getId(), LocalDate.now(), AppointmentStatus.CONFIRMED);
        long upcoming = appointmentRepository.countByDoctorIdAndAppointmentDateGreaterThanEqualAndStatus(
            doctor.getId(), LocalDate.now(), AppointmentStatus.CONFIRMED);
        long completed = appointmentRepository.countByDoctorIdAndStatus(doctor.getId(), AppointmentStatus.COMPLETED);

        return DoctorStatsDto.builder()
            .todayCount(today)
            .upcomingCount(upcoming)
            .completedCount(completed)
            .build();
    }

    @Transactional
    public void addClinicalNotes(Long appointmentId, String doctorEmail, String clinicalNotes) {
        Appointment appt = getAuthorizedDoctorAppointment(appointmentId, doctorEmail);
        appt.setClinicalNotes(clinicalNotes);
        appointmentRepository.save(appt);
        log.info("Clinical notes added for appointment {}", appointmentId);
    }

    @Transactional
    public PrescriptionDto addPrescription(Long appointmentId, String doctorEmail, PrescriptionCreateRequest req) {
        Appointment appt = getAuthorizedDoctorAppointment(appointmentId, doctorEmail);

        Prescription prescription = prescriptionRepository.findByAppointmentId(appointmentId)
            .orElseGet(() -> Prescription.builder()
                .appointment(appt)
                .build());

        prescription.setFollowUpInstructions(req.getFollowUpInstructions());
        prescription.getItems().clear();

        List<PrescriptionItem> items = new ArrayList<>();
        for (PrescriptionItemDto itemDto : req.getItems()) {
            items.add(PrescriptionItem.builder()
                .prescription(prescription)
                .medicineName(itemDto.getMedicineName())
                .dosage(itemDto.getDosage())
                .frequency(itemDto.getFrequency())
                .duration(itemDto.getDuration())
                .instructions(itemDto.getInstructions())
                .build());
        }
        prescription.getItems().addAll(items);

        prescription = prescriptionRepository.save(prescription);
        log.info("Prescription saved with {} items for appointment {}", items.size(), appointmentId);

        // Schedule medication reminders for patient
        createMedicationReminders(appt.getPatient(), prescription);

        return entityMapper.toPrescriptionDto(prescription);
    }

    @Transactional
    public AppointmentDto completeAppointment(Long appointmentId, String doctorEmail) {
        Appointment appt = getAuthorizedDoctorAppointment(appointmentId, doctorEmail);

        if (appt.getStatus() == AppointmentStatus.CANCELLED) {
            throw new AppointmentStateException("Cannot complete a cancelled appointment.");
        }

        appt.setStatus(AppointmentStatus.COMPLETED);
        appt = appointmentRepository.save(appt);
        log.info("Appointment {} marked as COMPLETED", appointmentId);

        // Trigger AI Post-Visit summary
        StringBuilder rxDetails = new StringBuilder();
        if (appt.getPrescription() != null && appt.getPrescription().getItems() != null) {
            for (PrescriptionItem item : appt.getPrescription().getItems()) {
                rxDetails.append(String.format("- %s (%s, %s for %s): %s\n",
                    item.getMedicineName(), item.getDosage(), item.getFrequency(), item.getDuration(),
                    item.getInstructions() != null ? item.getInstructions() : ""));
            }
            if (appt.getPrescription().getFollowUpInstructions() != null) {
                rxDetails.append("Follow-up: ").append(appt.getPrescription().getFollowUpInstructions());
            }
        }

        aiSummaryService.generatePostVisitSummaryAsync(
            appt.getId(),
            appt.getClinicalNotes() != null ? appt.getClinicalNotes() : "Standard consultation completed.",
            rxDetails.toString()
        );

        return entityMapper.toAppointmentDto(appt);
    }

    private void createMedicationReminders(Patient patient, Prescription prescription) {
        if (prescription.getItems() == null) return;

        Instant now = Instant.now();
        for (PrescriptionItem item : prescription.getItems()) {
            int remindersPerDay = parseFrequencyToDailyCount(item.getFrequency());
            int days = parseDurationToDays(item.getDuration());

            for (int day = 0; day < days; day++) {
                for (int slot = 0; slot < remindersPerDay; slot++) {
                    int hourOffset = 9 + (slot * (12 / Math.max(1, remindersPerDay))); // spread between 9 AM and 9 PM
                    Instant scheduled = now.plus(day, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS).plus(hourOffset, ChronoUnit.HOURS);
                    
                    if (scheduled.isAfter(now)) {
                        MedicationReminder reminder = MedicationReminder.builder()
                            .prescriptionItem(item)
                            .patient(patient)
                            .scheduledAt(scheduled)
                            .status(NotificationStatus.PENDING)
                            .retryCount(0)
                            .build();
                        medicationReminderRepository.save(reminder);
                    }
                }
            }
        }
    }

    private int parseFrequencyToDailyCount(String freq) {
        if (freq == null) return 1;
        String lower = freq.toLowerCase();
        if (lower.contains("three") || lower.contains("thrice") || lower.contains("3")) return 3;
        if (lower.contains("two") || lower.contains("twice") || lower.contains("2")) return 2;
        if (lower.contains("four") || lower.contains("4")) return 4;
        return 1;
    }

    private int parseDurationToDays(String duration) {
        if (duration == null) return 5;
        try {
            String digits = duration.replaceAll("\\D+", "");
            if (!digits.isBlank()) {
                int val = Integer.parseInt(digits);
                if (duration.toLowerCase().contains("week")) return val * 7;
                if (duration.toLowerCase().contains("month")) return val * 30;
                return val;
            }
        } catch (Exception ignored) {}
        return 5; // default 5 days
    }

    private Appointment getAuthorizedDoctorAppointment(Long appointmentId, String doctorEmail) {
        Appointment appt = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment", appointmentId));

        if (!appt.getDoctor().getUser().getEmail().equalsIgnoreCase(doctorEmail)) {
            throw new AccessDeniedException("You are not authorized to manage this appointment.");
        }
        return appt;
    }
}
