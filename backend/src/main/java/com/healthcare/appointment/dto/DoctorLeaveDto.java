package com.healthcare.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorLeaveDto {
    private Long id;
    private Long doctorId;
    private String doctorName;
    private LocalDate leaveDate;
    private String reason;
    private Instant createdAt;
}
