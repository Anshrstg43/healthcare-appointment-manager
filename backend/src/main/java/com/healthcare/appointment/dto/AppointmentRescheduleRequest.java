package com.healthcare.appointment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentRescheduleRequest {

    @NotNull(message = "New appointment date is required")
    private LocalDate appointmentDate;

    @NotNull(message = "New start time is required")
    private LocalTime startTime;

    @NotNull(message = "New end time is required")
    private LocalTime endTime;
}
