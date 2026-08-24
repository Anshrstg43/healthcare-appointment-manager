package com.healthcare.appointment.repository;

import com.healthcare.appointment.entity.MedicationReminder;
import com.healthcare.appointment.entity.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MedicationReminderRepository extends JpaRepository<MedicationReminder, Long> {
    List<MedicationReminder> findByStatusAndScheduledAtLessThanEqual(NotificationStatus status, Instant cutoffTime);
    List<MedicationReminder> findByPatientIdOrderByScheduledAtDesc(Long patientId);
}
