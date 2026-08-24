package com.healthcare.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkingScheduleDto {
    private WorkingHoursDto monday;
    private WorkingHoursDto tuesday;
    private WorkingHoursDto wednesday;
    private WorkingHoursDto thursday;
    private WorkingHoursDto friday;
    private WorkingHoursDto saturday;
    private WorkingHoursDto sunday;
}
