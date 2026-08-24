package com.healthcare.appointment.service;

import com.healthcare.appointment.entity.*;
import com.healthcare.appointment.repository.AppointmentRepository;
import com.healthcare.appointment.repository.NotificationRepository;
import com.healthcare.appointment.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    @Value("${app.mail.from:noreply@healthcareapp.com}")
    private String mailFrom;

    @Value("${app.mail.from-name:Healthcare Appointment Manager}")
    private String mailFromName;

    @Value("${app.mail.max-retries:3}")
    private int maxRetries;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Async
    @Transactional
    public void sendAppointmentConfirmationAsync(Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
        if (appt == null) return;

        User patientUser = appt.getPatient().getUser();
        String doctorName = appt.getDoctor().getUser().getName();
        String specialty = appt.getDoctor().getSpecialization();
        String subject = "Appointment Confirmed: Dr. " + doctorName + " on " + appt.getAppointmentDate();

        String htmlBody = buildHtmlEmail(
            "Appointment Confirmed",
            "Hello " + patientUser.getName() + ",",
            "<p>Your consultation with <strong>Dr. " + doctorName + "</strong> (" + specialty + ") is confirmed.</p>" +
            "<table style='width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f8fafc; border-radius: 8px; overflow: hidden;'>" +
            "<tr><td style='padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;'>Date</td><td style='padding: 10px 16px; border-bottom: 1px solid #e2e8f0;'>" + appt.getAppointmentDate() + "</td></tr>" +
            "<tr><td style='padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;'>Time</td><td style='padding: 10px 16px; border-bottom: 1px solid #e2e8f0;'>" + appt.getStartTime() + " - " + appt.getEndTime() + "</td></tr>" +
            "<tr><td style='padding: 10px 16px; font-weight: bold; color: #475569;'>Doctor</td><td style='padding: 10px 16px;'>Dr. " + doctorName + " (" + specialty + ")</td></tr>" +
            "</table>" +
            "<p>If you need to reschedule or view instructions, visit your patient portal.</p>",
            frontendUrl + "/appointments/" + appt.getId(),
            "View Appointment Details"
        );

        sendAndRecordNotification(appt.getId(), patientUser, NotificationType.APPOINTMENT_CONFIRMATION, subject, htmlBody);
    }

    @Async
    @Transactional
    public void sendAppointmentRescheduledAsync(Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
        if (appt == null) return;

        User patientUser = appt.getPatient().getUser();
        String doctorName = appt.getDoctor().getUser().getName();
        String subject = "Appointment Rescheduled: Dr. " + doctorName;

        String htmlBody = buildHtmlEmail(
            "Appointment Rescheduled",
            "Hello " + patientUser.getName() + ",",
            "<p>Your appointment has been successfully updated with new schedule details.</p>" +
            "<table style='width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f8fafc; border-radius: 8px;'>" +
            "<tr><td style='padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-weight: bold;'>Doctor</td><td style='padding: 10px 16px; border-bottom: 1px solid #e2e8f0;'>Dr. " + doctorName + "</td></tr>" +
            "<tr><td style='padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-weight: bold;'>New Date</td><td style='padding: 10px 16px; border-bottom: 1px solid #e2e8f0;'>" + appt.getAppointmentDate() + "</td></tr>" +
            "<tr><td style='padding: 10px 16px; font-weight: bold;'>New Time</td><td style='padding: 10px 16px;'>" + appt.getStartTime() + " - " + appt.getEndTime() + "</td></tr>" +
            "</table>",
            frontendUrl + "/appointments/" + appt.getId(),
            "View Rescheduled Booking"
        );

        sendAndRecordNotification(appt.getId(), patientUser, NotificationType.APPOINTMENT_RESCHEDULED, subject, htmlBody);
    }

    @Async
    @Transactional
    public void sendAppointmentCancellationAsync(Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
        if (appt == null) return;

        User patientUser = appt.getPatient().getUser();
        String doctorName = appt.getDoctor().getUser().getName();
        String subject = "Appointment Cancelled: Dr. " + doctorName;

        String htmlBody = buildHtmlEmail(
            "Appointment Cancelled",
            "Hello " + patientUser.getName() + ",",
            "<p>Your appointment scheduled for <strong>" + appt.getAppointmentDate() + "</strong> with <strong>Dr. " + doctorName + "</strong> has been cancelled.</p>" +
            "<p>You can browse other available specialists and book a new consultation at your convenience.</p>",
            frontendUrl + "/doctors",
            "Find a Doctor & Re-book"
        );

        sendAndRecordNotification(appt.getId(), patientUser, NotificationType.APPOINTMENT_CANCELLATION, subject, htmlBody);
    }

    @Async
    @Transactional
    public void sendDoctorLeaveImpactAsync(Appointment appt) {
        User patientUser = appt.getPatient().getUser();
        String doctorName = appt.getDoctor().getUser().getName();
        String subject = "Doctor Unavailable: Dr. " + doctorName + " on " + appt.getAppointmentDate();

        String htmlBody = buildHtmlEmail(
            "Schedule Alert: Doctor On Leave",
            "Hello " + patientUser.getName() + ",",
            "<p>We regret to inform you that <strong>Dr. " + doctorName + "</strong> is unexpectedly on approved leave on <strong>" + appt.getAppointmentDate() + "</strong>.</p>" +
            "<p>Your booking at " + appt.getStartTime() + " has been cancelled automatically to ensure you can re-book on an alternate date without delays.</p>",
            frontendUrl + "/doctors",
            "Re-book with Another Physician"
        );

        sendAndRecordNotification(appt.getId(), patientUser, NotificationType.DOCTOR_LEAVE_IMPACT, subject, htmlBody);
    }

    @Async
    @Transactional
    public void sendMedicationReminderAsync(Patient patient, PrescriptionItem item) {
        User user = patient.getUser();
        String subject = "💊 Medication Reminder: " + item.getMedicineName();

        String htmlBody = buildHtmlEmail(
            "Daily Medication Reminder",
            "Hello " + user.getName() + ",",
            "<p>This is your automated reminder to take your prescribed medication:</p>" +
            "<div style='background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px; margin: 16px 0; border-radius: 4px;'>" +
            "<p style='margin: 0 0 6px 0; font-size: 16px; font-weight: bold; color: #065f46;'>" + item.getMedicineName() + " — " + item.getDosage() + "</p>" +
            "<p style='margin: 0; color: #047857;'>Frequency: " + item.getFrequency() + "</p>" +
            "<p style='margin: 4px 0 0 0; font-size: 13px; color: #047857;'>Instructions: " + (item.getInstructions() != null ? item.getInstructions() : "Take with water as directed") + "</p>" +
            "</div>",
            frontendUrl + "/dashboard",
            "Open Medication Tracker"
        );

        sendAndRecordNotification(null, user, NotificationType.MEDICATION_REMINDER, subject, htmlBody);
    }

    private void sendAndRecordNotification(Long apptId, User recipient, NotificationType type, String subject, String body) {
        Notification notification = Notification.builder()
            .appointmentId(apptId)
            .recipient(recipient)
            .type(type)
            .channel("EMAIL")
            .subject(subject)
            .body(body)
            .status(NotificationStatus.PENDING)
            .retryCount(0)
            .build();

        notification = notificationRepository.save(notification);

        try {
            sendEmail(recipient.getEmail(), subject, body);
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(Instant.now());
            notificationRepository.save(notification);
            log.info("Email sent successfully: type={}, recipient={}", type, recipient.getEmail());
        } catch (Exception e) {
            log.warn("Email delivery failed for recipient {}: {}", recipient.getEmail(), e.getMessage());
            notification.setStatus(NotificationStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            notification.setRetryCount(1);
            notificationRepository.save(notification);
        }
    }

    private void sendEmail(String to, String subject, String htmlContent) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "utf-8");
        helper.setFrom(mailFrom, mailFromName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(message);
    }

    private String buildHtmlEmail(String headerTitle, String greeting, String mainContent, String ctaUrl, String ctaText) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
              <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px 30px; text-align: left;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">Healthcare Manager</h1>
                  <p style="margin: 4px 0 0 0; color: #e0f2fe; font-size: 14px;">""" + headerTitle + """
                  </p>
                </div>
                <div style="padding: 30px; line-height: 1.6; font-size: 15px;">
                  <p style="font-size: 16px; font-weight: 600; margin-top: 0;">""" + greeting + """
                  </p>
                  """ + mainContent + """
                  <div style="text-align: center; margin: 28px 0 16px 0;">
                    <a href='""" + ctaUrl + """
                    ' style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">""" + ctaText + """
                    </a>
                  </div>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                  <p style="font-size: 12px; color: #64748b; margin: 0; text-align: center;">
                    This is an automated notification from Healthcare Appointment & Follow-up Manager.<br>
                    Please do not reply directly to this email.
                  </p>
                </div>
              </div>
            </body>
            </html>
            """;
    }

    @Transactional
    public void retryFailedNotifications() {
        List<Notification> failed = notificationRepository.findByStatusAndRetryCountLessThan(
            NotificationStatus.FAILED, maxRetries
        );

        for (Notification n : failed) {
            try {
                sendEmail(n.getRecipient().getEmail(), n.getSubject(), n.getBody());
                n.setStatus(NotificationStatus.SENT);
                n.setSentAt(Instant.now());
                n.setErrorMessage(null);
                notificationRepository.save(n);
                log.info("Retried email notification {} sent successfully", n.getId());
            } catch (Exception e) {
                n.setRetryCount(n.getRetryCount() + 1);
                n.setErrorMessage(e.getMessage());
                notificationRepository.save(n);
                log.warn("Retry failed for notification {}: {}", n.getId(), e.getMessage());
            }
        }
    }
}
