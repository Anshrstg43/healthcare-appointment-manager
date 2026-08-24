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

    @Async
    @Transactional
    public void sendAppointmentConfirmationAsync(Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
        if (appt == null) return;

        User patientUser = appt.getPatient().getUser();
        String subject = "Appointment Confirmed: Dr. " + appt.getDoctor().getUser().getName() + " on " + appt.getAppointmentDate();
        String body = String.format(
            "Hello %s,\n\nYour appointment with Dr. %s (%s) is confirmed for %s from %s to %s.\n\n" +
            "If you need to reschedule or cancel, please visit your patient dashboard.\n\n" +
            "Best regards,\nHealthcare Team",
            patientUser.getName(), appt.getDoctor().getUser().getName(),
            appt.getDoctor().getSpecialization(), appt.getAppointmentDate(),
            appt.getStartTime(), appt.getEndTime()
        );

        sendAndRecordNotification(appt.getId(), patientUser, NotificationType.APPOINTMENT_CONFIRMATION, subject, body);
    }

    @Async
    @Transactional
    public void sendAppointmentRescheduledAsync(Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
        if (appt == null) return;

        User patientUser = appt.getPatient().getUser();
        String subject = "Appointment Rescheduled: Dr. " + appt.getDoctor().getUser().getName();
        String body = String.format(
            "Hello %s,\n\nYour appointment has been successfully rescheduled.\n\n" +
            "Doctor: Dr. %s\nNew Date: %s\nNew Time: %s - %s\n\n" +
            "Best regards,\nHealthcare Team",
            patientUser.getName(), appt.getDoctor().getUser().getName(),
            appt.getAppointmentDate(), appt.getStartTime(), appt.getEndTime()
        );

        sendAndRecordNotification(appt.getId(), patientUser, NotificationType.APPOINTMENT_RESCHEDULED, subject, body);
    }

    @Async
    @Transactional
    public void sendAppointmentCancellationAsync(Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
        if (appt == null) return;

        User patientUser = appt.getPatient().getUser();
        String subject = "Appointment Cancelled: Dr. " + appt.getDoctor().getUser().getName();
        String body = String.format(
            "Hello %s,\n\nYour appointment scheduled for %s with Dr. %s has been cancelled.\n\n" +
            "You can schedule a new appointment at any time through your dashboard.\n\n" +
            "Best regards,\nHealthcare Team",
            patientUser.getName(), appt.getAppointmentDate(), appt.getDoctor().getUser().getName()
        );

        sendAndRecordNotification(appt.getId(), patientUser, NotificationType.APPOINTMENT_CANCELLATION, subject, body);
    }

    @Async
    @Transactional
    public void sendDoctorLeaveImpactAsync(Appointment appt) {
        User patientUser = appt.getPatient().getUser();
        String subject = "Important: Doctor Unavailable on " + appt.getAppointmentDate();
        String body = String.format(
            "Hello %s,\n\nWe regret to inform you that Dr. %s is unexpectedly on leave on %s.\n\n" +
            "Your appointment at %s has been cancelled. Please visit the portal to re-book with Dr. %s for another day or choose another specialist.\n\n" +
            "We apologize for the inconvenience.\n\nHealthcare Team",
            patientUser.getName(), appt.getDoctor().getUser().getName(),
            appt.getAppointmentDate(), appt.getStartTime(), appt.getDoctor().getUser().getName()
        );

        sendAndRecordNotification(appt.getId(), patientUser, NotificationType.DOCTOR_LEAVE_IMPACT, subject, body);
    }

    @Async
    @Transactional
    public void sendMedicationReminderAsync(Patient patient, PrescriptionItem item) {
        User user = patient.getUser();
        String subject = "Medication Reminder: " + item.getMedicineName();
        String body = String.format(
            "Hello %s,\n\nThis is a reminder to take your medication:\n\n" +
            "Medicine: %s\nDosage: %s\nInstructions: %s\n\n" +
            "Stay healthy!\nHealthcare Team",
            user.getName(), item.getMedicineName(), item.getDosage(),
            item.getInstructions() != null ? item.getInstructions() : "Take as directed"
        );

        sendAndRecordNotification(null, user, NotificationType.MEDICATION_REMINDER, subject, body);
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

    private void sendEmail(String to, String subject, String content) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, "utf-8");
        helper.setFrom(mailFrom, mailFromName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(content, false);
        mailSender.send(message);
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
