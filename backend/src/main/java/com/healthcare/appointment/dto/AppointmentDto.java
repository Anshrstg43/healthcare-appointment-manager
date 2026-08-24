package com.healthcare.appointment.dto;

import com.healthcare.appointment.entity.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDto {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentStatus status;
    private String symptomsText;
    private String clinicalNotes;
    private PrescriptionDto prescription;
    private AiSummaryDto preVisitSummary;
    private AiSummaryDto postVisitSummary;
    private boolean calendarSynced;
    private Instant holdExpiresAt;
    private Instant createdAt;
    private Instant updatedAt;
}
