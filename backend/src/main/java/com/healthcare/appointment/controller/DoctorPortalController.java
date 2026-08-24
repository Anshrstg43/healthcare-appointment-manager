package com.healthcare.appointment.controller;

import com.healthcare.appointment.dto.*;
import com.healthcare.appointment.entity.AppointmentStatus;
import com.healthcare.appointment.service.ConsultationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Doctor Portal API", description = "Endpoints for doctor dashboard, consultations, notes, and prescriptions")
public class DoctorPortalController {

    private final ConsultationService consultationService;

    @GetMapping("/appointments")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Get list of appointments assigned to the authenticated doctor")
    public ResponseEntity<PageResponse<AppointmentDto>> getDoctorAppointments(
        @RequestParam(required = false) AppointmentStatus status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @PageableDefault(size = 10, sort = "appointmentDate", direction = Sort.Direction.DESC) Pageable pageable,
        Authentication authentication
    ) {
        return ResponseEntity.ok(PageResponse.from(
            consultationService.getDoctorAppointments(authentication.getName(), status, date, pageable)
        ));
    }

    @GetMapping("/appointments/today")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Get today's appointments for the authenticated doctor")
    public ResponseEntity<List<AppointmentDto>> getTodayAppointments(Authentication authentication) {
        return ResponseEntity.ok(consultationService.getDoctorTodayAppointments(authentication.getName()));
    }

    @PostMapping("/appointments/{id}/notes")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Add or update clinical consultation notes")
    public ResponseEntity<Map<String, String>> addClinicalNotes(
        @PathVariable Long id,
        @Valid @RequestBody ClinicalNotesRequest request,
        Authentication authentication
    ) {
        consultationService.addClinicalNotes(id, authentication.getName(), request.getClinicalNotes());
        return ResponseEntity.ok(Map.of("message", "Clinical notes saved successfully"));
    }

    @PostMapping("/appointments/{id}/prescription")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Add prescription and schedule automated medication reminders")
    public ResponseEntity<PrescriptionDto> addPrescription(
        @PathVariable Long id,
        @Valid @RequestBody PrescriptionCreateRequest request,
        Authentication authentication
    ) {
        PrescriptionDto prescription = consultationService.addPrescription(id, authentication.getName(), request);
        return ResponseEntity.ok(prescription);
    }

    @PostMapping("/appointments/{id}/complete")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Complete appointment and trigger AI post-visit patient summary")
    public ResponseEntity<AppointmentDto> completeAppointment(
        @PathVariable Long id,
        Authentication authentication
    ) {
        AppointmentDto appointment = consultationService.completeAppointment(id, authentication.getName());
        return ResponseEntity.ok(appointment);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Get dashboard metrics for authenticated doctor")
    public ResponseEntity<DoctorStatsDto> getDoctorStats(Authentication authentication) {
        return ResponseEntity.ok(consultationService.getDoctorStats(authentication.getName()));
    }
}
