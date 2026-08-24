package com.healthcare.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDto {
    private Long id;
    private Long appointmentId;
    private List<PrescriptionItemDto> items;
    private String followUpInstructions;
    private Instant createdAt;
}
