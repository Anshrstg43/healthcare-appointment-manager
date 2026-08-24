package com.healthcare.appointment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "ai_summaries", indexes = {
    @Index(name = "idx_ai_summary_appt_type", columnList = "appointment_id, summary_type")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @Enumerated(EnumType.STRING)
    @Column(name = "summary_type", nullable = false, length = 30)
    private AiSummaryType summaryType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private UrgencyLevel urgency;

    @Column(name = "chief_complaint", length = 255)
    private String chiefComplaint;

    @Column(name = "suggested_questions", columnDefinition = "JSON")
    private String suggestedQuestions; // JSON array of questions e.g. ["q1","q2","q3"]

    @Column(name = "summary_text", columnDefinition = "TEXT")
    private String summaryText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AiSummaryStatus status = AiSummaryStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
