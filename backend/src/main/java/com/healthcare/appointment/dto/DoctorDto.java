package com.healthcare.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDto {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String specialization;
    private String bio;
    private String qualifications;
    private Integer experienceYears;
    private WorkingScheduleDto workingSchedule;
    private Integer slotDurationMinutes;
    private boolean active;
    private Instant createdAt;
}
