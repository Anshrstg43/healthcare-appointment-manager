package com.healthcare.appointment.controller;

import com.healthcare.appointment.dto.*;
import com.healthcare.appointment.entity.AppointmentStatus;
import com.healthcare.appointment.entity.Role;
import com.healthcare.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Patient Appointments", description = "Endpoints for booking, viewing, rescheduling, and cancelling appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Book an appointment with pessimistic double-booking protection")
    public ResponseEntity<AppointmentDto> bookAppointment(
        @Valid @RequestBody AppointmentCreateRequest request,
        Authentication authentication
    ) {
        AppointmentDto appointment = appointmentService.bookAppointment(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(appointment);
    }

    @GetMapping
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "List appointments for the current authenticated patient")
    public ResponseEntity<PageResponse<AppointmentDto>> getMyAppointments(
        @RequestParam(required = false) AppointmentStatus status,
        @PageableDefault(size = 10, sort = "appointmentDate", direction = Sort.Direction.DESC) Pageable pageable,
        Authentication authentication
    ) {
        return ResponseEntity.ok(PageResponse.from(
            appointmentService.getPatientAppointments(authentication.getName(), status, pageable)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @Operation(summary = "Get appointment details by ID")
    public ResponseEntity<AppointmentDto> getAppointmentById(
        @PathVariable Long id,
        Authentication authentication
    ) {
        Role role = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")) ? Role.ADMIN :
            authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR")) ? Role.DOCTOR : Role.PATIENT;

        return ResponseEntity.ok(appointmentService.getAppointmentById(id, authentication.getName(), role));
    }

    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Reschedule an appointment to a new date and time")
    public ResponseEntity<AppointmentDto> rescheduleAppointment(
        @PathVariable Long id,
        @Valid @RequestBody AppointmentRescheduleRequest request,
        Authentication authentication
    ) {
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(id, authentication.getName(), request));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @Operation(summary = "Cancel an appointment")
    public ResponseEntity<Map<String, String>> cancelAppointment(
        @PathVariable Long id,
        Authentication authentication
    ) {
        Role role = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")) ? Role.ADMIN :
            authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR")) ? Role.DOCTOR : Role.PATIENT;

        appointmentService.cancelAppointment(id, authentication.getName(), role);
        return ResponseEntity.ok(Map.of("message", "Appointment cancelled successfully"));
    }

    @PostMapping("/{id}/symptoms")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Submit or update patient symptoms and trigger AI pre-visit summary")
    public ResponseEntity<Map<String, String>> submitSymptoms(
        @PathVariable Long id,
        @Valid @RequestBody SymptomSubmissionRequest request,
        Authentication authentication
    ) {
        appointmentService.submitSymptoms(id, authentication.getName(), request.getSymptomsText());
        return ResponseEntity.ok(Map.of("message", "Symptoms submitted; AI summary generation initiated"));
    }
}
