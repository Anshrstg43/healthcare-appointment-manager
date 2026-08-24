package com.healthcare.appointment.dto;

import lombok.Data;

@Data
public class DoctorUpdateRequest {
    private String name;
    private String phone;
    private String specialization;
    private String bio;
    private String qualifications;
    private Integer experienceYears;
    private WorkingScheduleDto workingSchedule;
    private Integer slotDurationMinutes;
    private Boolean active;
}
