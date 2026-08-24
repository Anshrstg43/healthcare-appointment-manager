package com.healthcare.appointment.scheduler;

import com.healthcare.appointment.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationRetryScheduler {

    private final NotificationService notificationService;

    /**
     * Retries failed notifications every 10 minutes.
     */
    @Scheduled(fixedRate = 600000)
    public void retryNotifications() {
        notificationService.retryFailedNotifications();
    }
}
