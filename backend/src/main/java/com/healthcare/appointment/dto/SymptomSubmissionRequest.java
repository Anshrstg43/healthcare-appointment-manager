package com.healthcare.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SymptomSubmissionRequest {

    @NotBlank(message = "Symptoms description is required")
    private String symptomsText;
}
