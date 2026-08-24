package com.healthcare.appointment.repository;

import com.healthcare.appointment.entity.CalendarEvent;
import com.healthcare.appointment.entity.CalendarSyncStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    Optional<CalendarEvent> findByAppointmentIdAndUserId(Long appointmentId, Long userId);
    List<CalendarEvent> findByAppointmentId(Long appointmentId);
    List<CalendarEvent> findBySyncStatus(CalendarSyncStatus syncStatus);
}
