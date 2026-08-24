package com.healthcare.appointment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.appointment.entity.*;
import com.healthcare.appointment.exception.ResourceNotFoundException;
import com.healthcare.appointment.repository.AiSummaryRepository;
import com.healthcare.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiSummaryService {

    private final AiSummaryRepository aiSummaryRepository;
    private final AppointmentRepository appointmentRepository;
    private final WebClient openAiWebClient;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.model:gpt-4o}")
    private String model;

    @Value("${app.ai.timeout-seconds:30}")
    private int timeoutSeconds;

    private static final List<String> EMERGENCY_KEYWORDS = List.of(
        "chest pain", "shortness of breath", "difficulty breathing", "stroke",
        "paralysis", "loss of consciousness", "anaphylaxis", "severe bleeding",
        "heart attack", "crushing chest", "unresponsive", "blue lips"
    );

    /**
     * Asynchronously generates Pre-Visit AI summary from patient symptoms.
     * Guaranteed non-blocking and safe against LLM failures.
     */
    @Async
    @Transactional
    public void generatePreVisitSummaryAsync(Long appointmentId, String symptomsText) {
        log.info("Generating AI pre-visit summary for appointment {}", appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) {
            log.warn("Cannot generate AI summary: appointment {} not found", appointmentId);
            return;
        }

        AiSummary summary = aiSummaryRepository.findByAppointmentIdAndSummaryType(appointmentId, AiSummaryType.PRE_VISIT)
            .orElseGet(() -> AiSummary.builder()
                .appointment(appointment)
                .summaryType(AiSummaryType.PRE_VISIT)
                .status(AiSummaryStatus.PENDING)
                .build());

        summary.setStatus(AiSummaryStatus.PENDING);
        summary = aiSummaryRepository.save(summary);

        try {
            boolean hasEmergencyKeyword = checkEmergencyRedFlags(symptomsText);
            String prompt = buildPreVisitPrompt(symptomsText, hasEmergencyKeyword);
            String aiResponse = callOpenAi(prompt);

            // Parse structured JSON output
            JsonNode root = objectMapper.readTree(aiResponse);
            String urgencyStr = root.path("urgency").asText(hasEmergencyKeyword ? "HIGH" : "MEDIUM").toUpperCase();
            UrgencyLevel urgency;
            try {
                urgency = UrgencyLevel.valueOf(urgencyStr);
            } catch (Exception e) {
                urgency = hasEmergencyKeyword ? UrgencyLevel.HIGH : UrgencyLevel.MEDIUM;
            }

            if (hasEmergencyKeyword) {
                urgency = UrgencyLevel.HIGH;
            }

            String chiefComplaint = root.path("chiefComplaint").asText("Symptom evaluation");
            JsonNode questionsNode = root.path("suggestedQuestions");
            List<String> questions = new ArrayList<>();
            if (questionsNode.isArray()) {
                questionsNode.forEach(q -> questions.add(q.asText()));
            }

            String summaryText = root.path("summary").asText("");
            if (hasEmergencyKeyword) {
                summaryText = "⚠️ CRITICAL RED-FLAG ALERT: Patient reported emergency-level symptoms (" + chiefComplaint + "). Immediate clinical attention or emergency dispatch is advised.\n\n" + summaryText;
            }

            summary.setUrgency(urgency);
            summary.setChiefComplaint(chiefComplaint);
            summary.setSuggestedQuestions(objectMapper.writeValueAsString(questions));
            summary.setSummaryText(summaryText);
            summary.setStatus(AiSummaryStatus.COMPLETED);
            summary.setErrorMessage(null);

            aiSummaryRepository.save(summary);
            log.info("AI pre-visit summary generated successfully for appointment {}", appointmentId);

        } catch (Exception e) {
            log.error("AI pre-visit summary generation failed for appointment {}: {}", appointmentId, e.getMessage());
            summary.setStatus(AiSummaryStatus.FAILED);
            summary.setErrorMessage("AI service unavailable: " + e.getMessage());
            aiSummaryRepository.save(summary);
        }
    }

    /**
     * Asynchronously generates Post-Visit AI summary from clinical notes and prescription.
     */
    @Async
    @Transactional
    public void generatePostVisitSummaryAsync(Long appointmentId, String clinicalNotes, String prescriptionDetails) {
        log.info("Generating AI post-visit summary for appointment {}", appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) return;

        AiSummary summary = aiSummaryRepository.findByAppointmentIdAndSummaryType(appointmentId, AiSummaryType.POST_VISIT)
            .orElseGet(() -> AiSummary.builder()
                .appointment(appointment)
                .summaryType(AiSummaryType.POST_VISIT)
                .status(AiSummaryStatus.PENDING)
                .build());

        summary.setStatus(AiSummaryStatus.PENDING);
        summary = aiSummaryRepository.save(summary);

        try {
            String prompt = buildPostVisitPrompt(clinicalNotes, prescriptionDetails);
            String aiResponse = callOpenAi(prompt);

            JsonNode root = objectMapper.readTree(aiResponse);
            String summaryText = root.path("summaryText").asText("");
            if (summaryText.isBlank()) {
                summaryText = aiResponse;
            }

            summary.setSummaryText(summaryText);
            summary.setStatus(AiSummaryStatus.COMPLETED);
            summary.setErrorMessage(null);

            aiSummaryRepository.save(summary);
            log.info("AI post-visit summary generated successfully for appointment {}", appointmentId);

        } catch (Exception e) {
            log.error("AI post-visit summary generation failed for appointment {}: {}", appointmentId, e.getMessage());
            summary.setStatus(AiSummaryStatus.FAILED);
            summary.setErrorMessage("AI summary generation failed: " + e.getMessage());
            aiSummaryRepository.save(summary);
        }
    }

    private boolean checkEmergencyRedFlags(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return EMERGENCY_KEYWORDS.stream().anyMatch(lower::contains);
    }

    private String callOpenAi(String systemAndUserPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("OPENAI_API_KEY is not set. Generating simulated AI response.");
            return generateMockAiResponse(systemAndUserPrompt);
        }

        Map<String, Object> requestBody = Map.of(
            "model", model,
            "response_format", Map.of("type", "json_object"),
            "messages", List.of(
                Map.of("role", "system", "content", "You are an administrative healthcare AI assistant. You never diagnose diseases or prescribe treatments. Always respond in valid JSON."),
                Map.of("role", "user", "content", systemAndUserPrompt)
            ),
            "temperature", 0.3
        );

        Map response = openAiWebClient.post()
            .uri("/chat/completions")
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map.class)
            .timeout(Duration.ofSeconds(timeoutSeconds))
            .block();

        if (response != null && response.containsKey("choices")) {
            List choices = (List) response.get("choices");
            if (!choices.isEmpty()) {
                Map first = (Map) choices.get(0);
                Map message = (Map) first.get("message");
                return (String) message.get("content");
            }
        }
        throw new RuntimeException("Empty response received from OpenAI API");
    }

    private String buildPreVisitPrompt(String symptoms, boolean isEmergency) {
        return """
            Analyze these patient-reported symptoms for administrative pre-visit intake.
            You must return a valid JSON object matching this exact schema:
            {
              "urgency": "LOW" | "MEDIUM" | "HIGH",
              "chiefComplaint": "Short 3-6 word summary",
              "suggestedQuestions": [
                "Question 1 for doctor to ask",
                "Question 2 for doctor to ask",
                "Question 3 for doctor to ask"
              ],
              "summary": "Brief 1-2 sentence intake overview."
            }
            
            """ + (isEmergency ? "CRITICAL: Patient exhibits potential high-risk emergency red-flag symptoms. Mark urgency as HIGH and include immediate safety notes.\n" : "") + """
            IMPORTANT: Do NOT diagnose or suggest medications.
            
            Patient Symptoms:
            """ + symptoms;
    }

    private String buildPostVisitPrompt(String notes, String prescription) {
        return """
            Convert the following doctor's consultation notes and prescription into a clear, patient-friendly visit summary.
            Return a valid JSON object with the key "summaryText".
            
            Include:
            1. Overview of what was discussed in plain English
            2. Medication schedule exactly as prescribed by the doctor (do NOT change dosages or frequency)
            3. Follow-up recommendations, dietary tips, and emergency warning signs
            
            Doctor Notes:
            """ + notes + "\n\nPrescription:\n" + prescription;
    }

    private String generateMockAiResponse(String prompt) {
        boolean isEmergency = prompt.toLowerCase().contains("chest pain") || prompt.toLowerCase().contains("shortness of breath") || prompt.contains("CRITICAL");
        if (prompt.contains("suggestedQuestions")) {
            if (isEmergency) {
                return """
                    {
                      "urgency": "HIGH",
                      "chiefComplaint": "Acute Chest / Respiratory Distress",
                      "suggestedQuestions": [
                        "When did the acute pain or shortness of breath start?",
                        "Does the pain radiate to the arm, shoulder, or jaw?",
                        "Are you experiencing dizziness, sweating, or nausea?"
                      ],
                      "summary": "Patient reported acute high-risk symptoms requiring prioritized physician review or immediate emergency care."
                    }
                    """;
            }
            return """
                {
                  "urgency": "MEDIUM",
                  "chiefComplaint": "Patient Reported Symptoms Evaluation",
                  "suggestedQuestions": [
                    "How long have these specific symptoms persisted?",
                    "Have you experienced any similar episodes in the past?",
                    "Are you currently taking any over-the-counter medications?"
                  ],
                  "summary": "Patient reports symptoms requiring medical evaluation. Intake processed for consultation."
                }
                """;
        } else {
            return """
                {
                  "summaryText": "## Consultation Summary\\n\\nYour physician has reviewed your condition and prescribed a targeted care plan.\\n\\n### Medication Instructions\\nPlease take all prescribed medications exactly according to the dosage and frequency instructions provided.\\n\\n### Follow-up & Precautions\\n- Maintain hydration and get plenty of rest.\\n- Follow specific dietary or lifestyle recommendations outlined by your doctor.\\n- If symptoms worsen or severe reactions occur, contact emergency care immediately."
                }
                """;
        }
    }
}
