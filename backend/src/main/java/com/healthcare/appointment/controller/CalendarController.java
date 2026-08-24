package com.healthcare.appointment.controller;

import com.healthcare.appointment.entity.Appointment;
import com.healthcare.appointment.exception.ResourceNotFoundException;
import com.healthcare.appointment.repository.AppointmentRepository;
import com.healthcare.appointment.service.GoogleCalendarService;
import com.healthcare.appointment.service.IcsCalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
@Tag(name = "Calendar API", description = "Google Calendar sync & RFC 5545 iCalendar (.ics) exports")
public class CalendarController {

    private final GoogleCalendarService calendarService;
    private final IcsCalendarService icsCalendarService;
    private final AppointmentRepository appointmentRepository;

    @GetMapping("/connect")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get Google Calendar OAuth 2.0 authorization URL")
    public ResponseEntity<Map<String, String>> getAuthUrl() {
        return ResponseEntity.ok(Map.of("authUrl", calendarService.getOAuthAuthUrl()));
    }

    @GetMapping("/callback")
    @Operation(summary = "Handle Google OAuth 2.0 redirect callback")
    public ResponseEntity<Map<String, String>> oauthCallback(@RequestParam(required = false) String code) {
        return ResponseEntity.ok(Map.of("message", "Calendar connected successfully", "code", code != null ? code : ""));
    }

    @PostMapping("/sync/{appointmentId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Manually trigger Google Calendar sync for an appointment")
    public ResponseEntity<Map<String, String>> syncAppointment(@PathVariable Long appointmentId) {
        calendarService.syncAppointmentEventAsync(appointmentId);
        return ResponseEntity.ok(Map.of("message", "Calendar sync initiated"));
    }

    @GetMapping("/export/{appointmentId}")
    @Operation(summary = "Download RFC 5545 compliant .ics calendar invitation file")
    public ResponseEntity<byte[]> exportIcs(@PathVariable Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        String icsContent = icsCalendarService.generateIcsContent(appointment);
        byte[] icsBytes = icsContent.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=appointment-" + appointmentId + ".ics")
                .contentType(MediaType.parseMediaType("text/calendar; charset=utf-8"))
                .body(icsBytes);
    }
}
