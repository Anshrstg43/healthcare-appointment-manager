package com.healthcare.appointment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DoctorLeaveRequest {

    @NotNull(message = "Leave date is required")
    private LocalDate leaveDate;

    private String reason;
}
