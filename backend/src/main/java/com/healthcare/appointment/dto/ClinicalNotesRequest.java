package com.healthcare.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClinicalNotesRequest {
    @NotBlank(message = "Clinical notes cannot be blank")
    private String clinicalNotes;
}
