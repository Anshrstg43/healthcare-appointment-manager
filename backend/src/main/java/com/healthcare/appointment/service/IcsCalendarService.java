package com.healthcare.appointment.service;

import com.healthcare.appointment.entity.Appointment;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class IcsCalendarService {

    private static final DateTimeFormatter ICS_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

    /**
     * Generates an RFC 5545 compliant .ics iCalendar file content for an appointment.
     */
    public String generateIcsContent(Appointment appointment) {
        LocalDateTime startDateTime = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime());
        LocalDateTime endDateTime = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getEndTime());
        String uid = "apt-" + appointment.getId() + "-" + UUID.randomUUID().toString().substring(0, 8) + "@healthcareapp.com";
        String now = LocalDateTime.now().format(ICS_FORMATTER) + "Z";

        String doctorName = appointment.getDoctor() != null ? appointment.getDoctor().getUser().getName() : "Specialist Physician";
        String specialty = appointment.getDoctor() != null ? appointment.getDoctor().getSpecialization() : "Consultation";
        String patientName = appointment.getPatient() != null ? appointment.getPatient().getUser().getName() : "Patient";
        String summary = "Medical Consultation: " + doctorName + " (" + specialty + ")";
        String description = "Healthcare Appointment\\nDoctor: " + doctorName + " (" + specialty + ")\\nPatient: " + patientName
                + (appointment.getSymptomsText() != null ? "\\nReason: " + appointment.getSymptomsText().replace("\n", "\\n") : "")
                + "\\nStatus: " + appointment.getStatus();

        return "BEGIN:VCALENDAR\r\n"
                + "VERSION:2.0\r\n"
                + "PRODID:-//Healthcare Appointment Manager//EN\r\n"
                + "CALSCALE:GREGORIAN\r\n"
                + "METHOD:REQUEST\r\n"
                + "BEGIN:VEVENT\r\n"
                + "UID:" + uid + "\r\n"
                + "DTSTAMP:" + now + "\r\n"
                + "DTSTART:" + startDateTime.format(ICS_FORMATTER) + "\r\n"
                + "DTEND:" + endDateTime.format(ICS_FORMATTER) + "\r\n"
                + "SUMMARY:" + escapeIcs(summary) + "\r\n"
                + "DESCRIPTION:" + escapeIcs(description) + "\r\n"
                + "LOCATION:Main Clinic / Telehealth Consultation Room\r\n"
                + "STATUS:CONFIRMED\r\n"
                + "BEGIN:VALARM\r\n"
                + "TRIGGER:-PT30M\r\n"
                + "ACTION:DISPLAY\r\n"
                + "DESCRIPTION:Reminder: Medical appointment in 30 minutes\r\n"
                + "END:VALARM\r\n"
                + "END:VEVENT\r\n"
                + "END:VCALENDAR\r\n";
    }

    private String escapeIcs(String text) {
        if (text == null) return "";
        return text.replace(",", "\\,").replace(";", "\\;");
    }
}
