package com.healthcare.appointment.repository;

import com.healthcare.appointment.entity.DoctorLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorLeaveRepository extends JpaRepository<DoctorLeave, Long> {
    List<DoctorLeave> findByDoctorIdAndLeaveDateGreaterThanEqualOrderByLeaveDateAsc(Long doctorId, LocalDate fromDate);
    List<DoctorLeave> findByDoctorIdOrderByLeaveDateDesc(Long doctorId);
    boolean existsByDoctorIdAndLeaveDate(Long doctorId, LocalDate leaveDate);
    Optional<DoctorLeave> findByDoctorIdAndLeaveDate(Long doctorId, LocalDate leaveDate);
    long countByLeaveDate(LocalDate date);
}
