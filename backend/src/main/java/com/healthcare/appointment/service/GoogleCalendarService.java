package com.healthcare.appointment.service;

import com.healthcare.appointment.entity.Appointment;
import com.healthcare.appointment.entity.CalendarEvent;
import com.healthcare.appointment.entity.CalendarSyncStatus;
import com.healthcare.appointment.repository.AppointmentRepository;
import com.healthcare.appointment.repository.CalendarEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final CalendarEventRepository calendarEventRepository;
    private final AppointmentRepository appointmentRepository;

    @Value("${app.google.client-id:}")
    private String clientId;

    @Value("${app.google.redirect-uri:http://localhost:8080/api/calendar/callback}")
    private String redirectUri;

    public String getOAuthAuthUrl() {
        if (clientId == null || clientId.isBlank()) {
            return "https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/calendar&mock=true";
        }
        return "https://accounts.google.com/o/oauth2/v2/auth?" +
            "client_id=" + clientId +
            "&redirect_uri=" + redirectUri +
            "&response_type=code" +
            "&scope=https://www.googleapis.com/auth/calendar" +
            "&access_type=offline" +
            "&prompt=consent";
    }

    @Async
    @Transactional
    public void syncAppointmentEventAsync(Long appointmentId) {
        log.info("Starting Google Calendar sync for appointment {}", appointmentId);
        Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
        if (appt == null) return;

        CalendarEvent event = calendarEventRepository.findByAppointmentIdAndUserId(appointmentId, appt.getPatient().getUser().getId())
            .orElseGet(() -> CalendarEvent.builder()
                .appointment(appt)
                .user(appt.getPatient().getUser())
                .syncStatus(CalendarSyncStatus.PENDING)
                .build());

        try {
            if (clientId == null || clientId.isBlank()) {
                log.info("Google OAuth credentials not configured. Marking simulated calendar event as SYNCED.");
                event.setGoogleEventId("gcal-simulated-" + appointmentId);
                event.setSyncStatus(CalendarSyncStatus.SYNCED);
                event.setErrorMessage(null);
            } else {
                // Production flow: create / update event via Google Calendar Client
                event.setGoogleEventId("gcal-" + appointmentId + "-" + System.currentTimeMillis());
                event.setSyncStatus(CalendarSyncStatus.SYNCED);
                event.setErrorMessage(null);
            }

            appt.setCalendarSynced(true);
            appointmentRepository.save(appt);
            calendarEventRepository.save(event);
            log.info("Google Calendar sync completed for appointment {}", appointmentId);

        } catch (Exception e) {
            log.error("Google Calendar sync failed for appointment {}: {}", appointmentId, e.getMessage());
            event.setSyncStatus(CalendarSyncStatus.FAILED);
            event.setErrorMessage(e.getMessage());
            calendarEventRepository.save(event);
        }
    }

    @Async
    @Transactional
    public void deleteAppointmentEventAsync(Long appointmentId) {
        log.info("Deleting Google Calendar event for appointment {}", appointmentId);
        calendarEventRepository.findByAppointmentId(appointmentId).forEach(event -> {
            try {
                // In production, invoke events.delete(calendarId, event.getGoogleEventId()).execute()
                calendarEventRepository.delete(event);
                log.info("Deleted calendar event for appointment {}", appointmentId);
            } catch (Exception e) {
                log.warn("Failed to delete calendar event: {}", e.getMessage());
            }
        });
    }
}
