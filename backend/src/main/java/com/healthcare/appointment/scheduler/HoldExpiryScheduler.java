package com.healthcare.appointment.scheduler;

import com.healthcare.appointment.entity.Appointment;
import com.healthcare.appointment.entity.AppointmentStatus;
import com.healthcare.appointment.repository.AppointmentRepository;
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
public class HoldExpiryScheduler {

    private final AppointmentRepository appointmentRepository;

    /**
     * Cleans up expired HELD slots every 60 seconds.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupExpiredHolds() {
        List<Appointment> expired = appointmentRepository.findByStatusAndHoldExpiresAtBefore(
            AppointmentStatus.HELD, Instant.now()
        );

        if (!expired.isEmpty()) {
            log.info("Expiring {} abandoned held appointment slots", expired.size());
            for (Appointment appt : expired) {
                appt.setStatus(AppointmentStatus.CANCELLED);
                appointmentRepository.save(appt);
            }
        }
    }
}
