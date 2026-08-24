package com.healthcare.appointment.controller;

import com.healthcare.appointment.dto.PatientStatsDto;
import com.healthcare.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Patient Portal API", description = "Patient portal specific endpoints")
public class PatientPortalController {

    private final AppointmentService appointmentService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get dashboard metrics for authenticated patient")
    public ResponseEntity<PatientStatsDto> getStats(Authentication authentication) {
        return ResponseEntity.ok(appointmentService.getPatientStats(authentication.getName()));
    }
}
