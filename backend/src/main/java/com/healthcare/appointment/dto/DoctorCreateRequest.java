package com.healthcare.appointment.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DoctorCreateRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String phone;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    private String bio;
    private String qualifications;
    private Integer experienceYears;

    private WorkingScheduleDto workingSchedule;

    @NotNull(message = "Slot duration is required")
    private Integer slotDurationMinutes;
}
