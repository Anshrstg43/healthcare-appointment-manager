package com.healthcare.appointment.service;

import com.healthcare.appointment.dto.*;
import com.healthcare.appointment.entity.*;
import com.healthcare.appointment.exception.*;
import com.healthcare.appointment.mapper.EntityMapper;
import com.healthcare.appointment.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final DoctorLeaveRepository doctorLeaveRepository;
    private final AiSummaryService aiSummaryService;
    private final NotificationService notificationService;
    private final GoogleCalendarService calendarService;
    private final EntityMapper entityMapper;

    @Value("${app.appointments.hold-duration-minutes:10}")
    private int holdDurationMinutes;

    /**
     * Creates an appointment with strict double-booking prevention:
     * - Uses PESSIMISTIC_WRITE row lock to serialize booking attempts for the same slot
     * - Checks for doctor leave
     * - Saves appointment in transaction
     * - Dispatches async AI pre-visit summary, email notification, and calendar sync
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AppointmentDto bookAppointment(String patientEmail, AppointmentCreateRequest req) {
        Patient patient = patientRepository.findByUserEmail(patientEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + patientEmail));

        Doctor doctor = doctorRepository.findById(req.getDoctorId())
            .orElseThrow(() -> new ResourceNotFoundException("Doctor", req.getDoctorId()));

        if (!doctor.isActive()) {
            throw new IllegalArgumentException("Cannot book appointment with inactive doctor.");
        }

        // 1. Check leave
        if (doctorLeaveRepository.existsByDoctorIdAndLeaveDate(doctor.getId(), req.getAppointmentDate())) {
            throw new DoctorOnLeaveException("Doctor is on leave on " + req.getAppointmentDate());
        }

        // 2. Pessimistic lock check for overlapping bookings
        List<Appointment> conflicts = appointmentRepository.findActiveOverlappingAppointmentsForUpdate(
            doctor.getId(),
            req.getAppointmentDate(),
            req.getStartTime()
        );

        if (!conflicts.isEmpty()) {
            log.warn("Booking conflict detected for doctor={}, date={}, time={}",
                doctor.getId(), req.getAppointmentDate(), req.getStartTime());
            throw new SlotUnavailableException("The selected appointment slot is already booked. Please choose another time.");
        }

        // 3. Create appointment
        Appointment appointment = Appointment.builder()
            .patient(patient)
            .doctor(doctor)
            .appointmentDate(req.getAppointmentDate())
            .startTime(req.getStartTime())
            .endTime(req.getEndTime())
            .status(AppointmentStatus.CONFIRMED)
            .symptomsText(req.getSymptomsText())
            .holdExpiresAt(Instant.now().plus(holdDurationMinutes, ChronoUnit.MINUTES))
            .calendarSynced(false)
            .build();

        appointment = appointmentRepository.save(appointment);
        log.info("Appointment booked successfully: id={}, patient={}, doctor={}, date={}, time={}",
            appointment.getId(), patient.getId(), doctor.getId(), appointment.getAppointmentDate(), appointment.getStartTime());

        // 4. Trigger Async Integrations (failures will not break the transaction)
        if (req.getSymptomsText() != null && !req.getSymptomsText().isBlank()) {
            aiSummaryService.generatePreVisitSummaryAsync(appointment.getId(), req.getSymptomsText());
        }

        notificationService.sendAppointmentConfirmationAsync(appointment.getId());
        calendarService.syncAppointmentEventAsync(appointment.getId());

        return entityMapper.toAppointmentDto(appointment);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentDto> getPatientAppointments(String patientEmail, AppointmentStatus status, Pageable pageable) {
        Patient patient = patientRepository.findByUserEmail(patientEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        Page<Appointment> page;
        if (status != null) {
            page = appointmentRepository.findByPatientIdAndStatusOrderByAppointmentDateDescStartTimeDesc(patient.getId(), status, pageable);
        } else {
            page = appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(patient.getId(), pageable);
        }

        return page.map(entityMapper::toAppointmentDto);
    }

    @Transactional(readOnly = true)
    public AppointmentDto getAppointmentById(Long id, String currentUserEmail, Role role) {
        Appointment appt = appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        // Enforce authorization
        if (role == Role.PATIENT && !appt.getPatient().getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You are not authorized to view this appointment.");
        } else if (role == Role.DOCTOR && !appt.getDoctor().getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You are not authorized to view this appointment.");
        }

        return entityMapper.toAppointmentDto(appt);
    }

    @Transactional
    public AppointmentDto rescheduleAppointment(Long id, String patientEmail, AppointmentRescheduleRequest req) {
        Appointment appt = appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        if (!appt.getPatient().getUser().getEmail().equalsIgnoreCase(patientEmail)) {
            throw new AccessDeniedException("You can only reschedule your own appointments.");
        }

        if (appt.getStatus() == AppointmentStatus.COMPLETED || appt.getStatus() == AppointmentStatus.CANCELLED) {
            throw new AppointmentStateException("Cannot reschedule a " + appt.getStatus() + " appointment.");
        }

        // Check leave on new date
        if (doctorLeaveRepository.existsByDoctorIdAndLeaveDate(appt.getDoctor().getId(), req.getAppointmentDate())) {
            throw new DoctorOnLeaveException("Doctor is on leave on " + req.getAppointmentDate());
        }

        // Lock check new slot
        List<Appointment> conflicts = appointmentRepository.findActiveOverlappingAppointmentsForUpdate(
            appt.getDoctor().getId(),
            req.getAppointmentDate(),
            req.getStartTime()
        );

        if (!conflicts.isEmpty()) {
            throw new SlotUnavailableException("The selected slot is already booked. Please choose another time.");
        }

        appt.setAppointmentDate(req.getAppointmentDate());
        appt.setStartTime(req.getStartTime());
        appt.setEndTime(req.getEndTime());
        appt.setStatus(AppointmentStatus.CONFIRMED);

        appt = appointmentRepository.save(appt);
        log.info("Appointment {} rescheduled to {}, {}", id, req.getAppointmentDate(), req.getStartTime());

        notificationService.sendAppointmentRescheduledAsync(appt.getId());
        calendarService.syncAppointmentEventAsync(appt.getId());

        return entityMapper.toAppointmentDto(appt);
    }

    @Transactional
    public void cancelAppointment(Long id, String userEmail, Role role) {
        Appointment appt = appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        if (role == Role.PATIENT && !appt.getPatient().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You can only cancel your own appointments.");
        } else if (role == Role.DOCTOR && !appt.getDoctor().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You can only cancel your own appointments.");
        }

        if (appt.getStatus() == AppointmentStatus.CANCELLED || appt.getStatus() == AppointmentStatus.COMPLETED) {
            throw new AppointmentStateException("Cannot cancel an appointment that is already " + appt.getStatus());
        }

        appt.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appt);
        log.info("Appointment {} cancelled by user={}", id, userEmail);

        notificationService.sendAppointmentCancellationAsync(appt.getId());
        calendarService.deleteAppointmentEventAsync(appt.getId());
    }

    @Transactional
    public void submitSymptoms(Long id, String patientEmail, String symptomsText) {
        Appointment appt = appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        if (!appt.getPatient().getUser().getEmail().equalsIgnoreCase(patientEmail)) {
            throw new AccessDeniedException("You can only submit symptoms for your own appointment.");
        }

        appt.setSymptomsText(symptomsText);
        appointmentRepository.save(appt);

        aiSummaryService.generatePreVisitSummaryAsync(appt.getId(), symptomsText);
    }

    @Transactional(readOnly = true)
    public PatientStatsDto getPatientStats(String patientEmail) {
        Patient patient = patientRepository.findByUserEmail(patientEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        long upcoming = appointmentRepository.countByPatientIdAndAppointmentDateGreaterThanEqualAndStatus(
            patient.getId(), LocalDate.now(), AppointmentStatus.CONFIRMED);
        long completed = appointmentRepository.countByPatientIdAndStatus(patient.getId(), AppointmentStatus.COMPLETED);
        long cancelled = appointmentRepository.countByPatientIdAndStatus(patient.getId(), AppointmentStatus.CANCELLED);

        return PatientStatsDto.builder()
            .upcomingCount(upcoming)
            .completedCount(completed)
            .cancelledCount(cancelled)
            .build();
    }
}
