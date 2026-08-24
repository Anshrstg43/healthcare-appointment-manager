package com.healthcare.appointment.controller;

import com.healthcare.appointment.service.GoogleCalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
@Tag(name = "Google Calendar API", description = "OAuth2 flow and calendar sync endpoints")
public class CalendarController {

    private final GoogleCalendarService calendarService;

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
}
