package com.healthcare.appointment.repository;

import com.healthcare.appointment.entity.Notification;
import com.healthcare.appointment.entity.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByStatusAndRetryCountLessThan(NotificationStatus status, int maxRetries);
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
}
