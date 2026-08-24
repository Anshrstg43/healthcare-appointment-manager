package com.healthcare.appointment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "calendar_events", indexes = {
    @Index(name = "idx_calendar_event_appt", columnList = "appointment_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "google_event_id")
    private String googleEventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status", nullable = false, length = 20)
    @Builder.Default
    private CalendarSyncStatus syncStatus = CalendarSyncStatus.PENDING;

    @Column(name = "error_message")
    private String errorMessage;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
