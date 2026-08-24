package com.healthcare.appointment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class PrescriptionCreateRequest {

    @NotEmpty(message = "At least one prescription item is required")
    @Valid
    private List<PrescriptionItemDto> items;

    private String followUpInstructions;
}
