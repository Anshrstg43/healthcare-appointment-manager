package com.healthcare.appointment.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.appointment.dto.*;
import com.healthcare.appointment.entity.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class EntityMapper {

    private final ObjectMapper objectMapper;

    public UserDto toUserDto(User user) {
        if (user == null) return null;
        return UserDto.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .phone(user.getPhone())
            .role(user.getRole())
            .active(user.isActive())
            .createdAt(user.getCreatedAt())
            .build();
    }

    public DoctorDto toDoctorDto(Doctor doctor) {
        if (doctor == null) return null;
        WorkingScheduleDto schedule = null;
        if (doctor.getWorkingSchedule() != null && !doctor.getWorkingSchedule().isBlank()) {
            try {
                schedule = objectMapper.readValue(doctor.getWorkingSchedule(), WorkingScheduleDto.class);
            } catch (Exception e) {
                log.warn("Failed to parse working schedule for doctor {}: {}", doctor.getId(), e.getMessage());
            }
        }

        return DoctorDto.builder()
            .id(doctor.getId())
            .userId(doctor.getUser().getId())
            .name(doctor.getUser().getName())
            .email(doctor.getUser().getEmail())
            .phone(doctor.getUser().getPhone())
            .specialization(doctor.getSpecialization())
            .bio(doctor.getBio())
            .qualifications(doctor.getQualifications())
            .experienceYears(doctor.getExperienceYears())
            .workingSchedule(schedule)
            .slotDurationMinutes(doctor.getSlotDurationMinutes())
            .active(doctor.isActive())
            .createdAt(doctor.getCreatedAt())
            .build();
    }

    public AppointmentDto toAppointmentDto(Appointment appt) {
        if (appt == null) return null;

        AiSummaryDto preVisit = null;
        AiSummaryDto postVisit = null;

        if (appt.getAiSummaries() != null) {
            for (AiSummary s : appt.getAiSummaries()) {
                if (s.getSummaryType() == AiSummaryType.PRE_VISIT) {
                    preVisit = toAiSummaryDto(s);
                } else if (s.getSummaryType() == AiSummaryType.POST_VISIT) {
                    postVisit = toAiSummaryDto(s);
                }
            }
        }

        return AppointmentDto.builder()
            .id(appt.getId())
            .patientId(appt.getPatient().getId())
            .patientName(appt.getPatient().getUser().getName())
            .patientEmail(appt.getPatient().getUser().getEmail())
            .patientPhone(appt.getPatient().getUser().getPhone())
            .doctorId(appt.getDoctor().getId())
            .doctorName(appt.getDoctor().getUser().getName())
            .doctorSpecialization(appt.getDoctor().getSpecialization())
            .appointmentDate(appt.getAppointmentDate())
            .startTime(appt.getStartTime())
            .endTime(appt.getEndTime())
            .status(appt.getStatus())
            .symptomsText(appt.getSymptomsText())
            .clinicalNotes(appt.getClinicalNotes())
            .prescription(toPrescriptionDto(appt.getPrescription()))
            .preVisitSummary(preVisit)
            .postVisitSummary(postVisit)
            .calendarSynced(appt.isCalendarSynced())
            .holdExpiresAt(appt.getHoldExpiresAt())
            .createdAt(appt.getCreatedAt())
            .updatedAt(appt.getUpdatedAt())
            .build();
    }

    public AiSummaryDto toAiSummaryDto(AiSummary summary) {
        if (summary == null) return null;
        List<String> questions = Collections.emptyList();
        if (summary.getSuggestedQuestions() != null && !summary.getSuggestedQuestions().isBlank()) {
            try {
                questions = objectMapper.readValue(summary.getSuggestedQuestions(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse suggested questions: {}", e.getMessage());
            }
        }

        return AiSummaryDto.builder()
            .id(summary.getId())
            .appointmentId(summary.getAppointment().getId())
            .type(summary.getSummaryType())
            .urgency(summary.getUrgency())
            .chiefComplaint(summary.getChiefComplaint())
            .suggestedQuestions(questions)
            .summaryText(summary.getSummaryText())
            .status(summary.getStatus())
            .errorMessage(summary.getErrorMessage())
            .createdAt(summary.getCreatedAt())
            .build();
    }

    public PrescriptionDto toPrescriptionDto(Prescription p) {
        if (p == null) return null;
        List<PrescriptionItemDto> items = Collections.emptyList();
        if (p.getItems() != null) {
            items = p.getItems().stream()
                .map(this::toPrescriptionItemDto)
                .collect(Collectors.toList());
        }

        return PrescriptionDto.builder()
            .id(p.getId())
            .appointmentId(p.getAppointment().getId())
            .items(items)
            .followUpInstructions(p.getFollowUpInstructions())
            .createdAt(p.getCreatedAt())
            .build();
    }

    public PrescriptionItemDto toPrescriptionItemDto(PrescriptionItem item) {
        if (item == null) return null;
        return PrescriptionItemDto.builder()
            .id(item.getId())
            .medicineName(item.getMedicineName())
            .dosage(item.getDosage())
            .frequency(item.getFrequency())
            .duration(item.getDuration())
            .instructions(item.getInstructions())
            .build();
    }

    public DoctorLeaveDto toDoctorLeaveDto(DoctorLeave leave) {
        if (leave == null) return null;
        return DoctorLeaveDto.builder()
            .id(leave.getId())
            .doctorId(leave.getDoctor().getId())
            .doctorName(leave.getDoctor().getUser().getName())
            .leaveDate(leave.getLeaveDate())
            .reason(leave.getReason())
            .createdAt(leave.getCreatedAt())
            .build();
    }
}
