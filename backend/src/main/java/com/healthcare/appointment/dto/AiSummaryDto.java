package com.healthcare.appointment.dto;

import com.healthcare.appointment.entity.AiSummaryStatus;
import com.healthcare.appointment.entity.AiSummaryType;
import com.healthcare.appointment.entity.UrgencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSummaryDto {
    private Long id;
    private Long appointmentId;
    private AiSummaryType type;
    private UrgencyLevel urgency;
    private String chiefComplaint;
    private List<String> suggestedQuestions;
    private String summaryText;
    private AiSummaryStatus status;
    private String errorMessage;
    private Instant createdAt;
}
