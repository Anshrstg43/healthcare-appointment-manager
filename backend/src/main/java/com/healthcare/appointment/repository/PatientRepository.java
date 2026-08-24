package com.healthcare.appointment.repository;

import com.healthcare.appointment.entity.Patient;
import com.healthcare.appointment.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUser(User user);
    Optional<Patient> findByUserId(Long userId);
    Optional<Patient> findByUserEmail(String email);
}
