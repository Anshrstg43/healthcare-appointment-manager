package com.healthcare.appointment.repository;

import com.healthcare.appointment.entity.AiSummary;
import com.healthcare.appointment.entity.AiSummaryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiSummaryRepository extends JpaRepository<AiSummary, Long> {
    Optional<AiSummary> findByAppointmentIdAndSummaryType(Long appointmentId, AiSummaryType summaryType);
    List<AiSummary> findByAppointmentId(Long appointmentId);
}
