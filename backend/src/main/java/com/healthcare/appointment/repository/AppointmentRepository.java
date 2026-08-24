package com.healthcare.appointment.repository;

import com.healthcare.appointment.entity.Appointment;
import com.healthcare.appointment.entity.AppointmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Pessimistic write lock to prevent simultaneous double booking
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date AND a.startTime = :startTime " +
           "AND a.status IN ('HELD', 'CONFIRMED')")
    List<Appointment> findActiveOverlappingAppointmentsForUpdate(
        @Param("doctorId") Long doctorId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime
    );

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND a.status IN ('HELD', 'CONFIRMED')")
    List<Appointment> findActiveDoctorAppointmentsOnDate(
        @Param("doctorId") Long doctorId,
        @Param("date") LocalDate date
    );

    // Patient queries
    Page<Appointment> findByPatientIdOrderByAppointmentDateDescStartTimeDesc(Long patientId, Pageable pageable);
    Page<Appointment> findByPatientIdAndStatusOrderByAppointmentDateDescStartTimeDesc(Long patientId, AppointmentStatus status, Pageable pageable);

    // Doctor queries
    Page<Appointment> findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(Long doctorId, Pageable pageable);
    Page<Appointment> findByDoctorIdAndStatusOrderByAppointmentDateDescStartTimeDesc(Long doctorId, AppointmentStatus status, Pageable pageable);
    List<Appointment> findByDoctorIdAndAppointmentDateOrderByStartTimeAsc(Long doctorId, LocalDate date);

    // Doctor leave impact check
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date AND a.status IN ('HELD', 'CONFIRMED')")
    List<Appointment> findAppointmentsAffectedByLeave(
        @Param("doctorId") Long doctorId,
        @Param("date") LocalDate date
    );

    // Expired held appointments
    List<Appointment> findByStatusAndHoldExpiresAtBefore(AppointmentStatus status, Instant time);

    // Stats
    long countByStatus(AppointmentStatus status);
    long countByAppointmentDateAndStatus(LocalDate date, AppointmentStatus status);
    long countByAppointmentDate(LocalDate date);
    long countByAppointmentDateGreaterThanAndStatus(LocalDate date, AppointmentStatus status);

    long countByDoctorIdAndAppointmentDateAndStatus(Long doctorId, LocalDate date, AppointmentStatus status);
    long countByDoctorIdAndAppointmentDateGreaterThanEqualAndStatus(Long doctorId, LocalDate date, AppointmentStatus status);
    long countByDoctorIdAndStatus(Long doctorId, AppointmentStatus status);

    long countByPatientIdAndStatus(Long patientId, AppointmentStatus status);
    long countByPatientIdAndAppointmentDateGreaterThanEqualAndStatus(Long patientId, LocalDate date, AppointmentStatus status);
}
