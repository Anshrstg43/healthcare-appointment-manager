package com.healthcare.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private long totalPatients;
    private long totalDoctors;
    private long todayAppointments;
    private long upcomingAppointments;
    private long cancelledAppointments;
    private long doctorsOnLeave;
}
