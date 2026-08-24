package com.healthcare.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotDto {
    private LocalTime startTime;
    private LocalTime endTime;
    private boolean available;
    private String reason; // optional: "BOOKED", "HELD", "LEAVE", "OUTSIDE_HOURS"
}
