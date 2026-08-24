package com.healthcare.appointment.scheduler;

import com.healthcare.appointment.entity.MedicationReminder;
import com.healthcare.appointment.entity.NotificationStatus;
import com.healthcare.appointment.repository.MedicationReminderRepository;
import com.healthcare.appointment.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MedicationReminderScheduler {

    private final MedicationReminderRepository reminderRepository;
    private final NotificationService notificationService;

    /**
     * Runs every 5 minutes to process due medication reminders.
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void processDueMedicationReminders() {
        Instant now = Instant.now();
        List<MedicationReminder> dueReminders = reminderRepository.findByStatusAndScheduledAtLessThanEqual(
            NotificationStatus.PENDING, now
        );

        if (dueReminders.isEmpty()) {
            return;
        }

        log.info("Processing {} due medication reminders", dueReminders.size());

        for (MedicationReminder reminder : dueReminders) {
            try {
                notificationService.sendMedicationReminderAsync(reminder.getPatient(), reminder.getPrescriptionItem());
                reminder.setStatus(NotificationStatus.SENT);
                reminder.setLastAttemptAt(Instant.now());
                reminderRepository.save(reminder);
            } catch (Exception e) {
                log.error("Failed to process medication reminder {}: {}", reminder.getId(), e.getMessage());
                reminder.setStatus(NotificationStatus.FAILED);
                reminder.setRetryCount(reminder.getRetryCount() + 1);
                reminder.setLastAttemptAt(Instant.now());
                reminder.setErrorMessage(e.getMessage());
                reminderRepository.save(reminder);
            }
        }
    }
}
