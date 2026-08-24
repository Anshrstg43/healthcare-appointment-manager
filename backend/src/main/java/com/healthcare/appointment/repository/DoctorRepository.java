package com.healthcare.appointment.repository;

import com.healthcare.appointment.entity.Doctor;
import com.healthcare.appointment.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUser(User user);
    Optional<Doctor> findByUserId(Long userId);
    Optional<Doctor> findByUserEmail(String email);

    Page<Doctor> findByActiveTrue(Pageable pageable);

    @Query("SELECT d FROM Doctor d JOIN d.user u WHERE d.active = true " +
           "AND (:specialization IS NULL OR LOWER(d.specialization) LIKE LOWER(CONCAT('%', :specialization, '%'))) " +
           "AND (:name IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%')))")
    Page<Doctor> searchDoctors(
        @Param("specialization") String specialization,
        @Param("name") String name,
        Pageable pageable
    );

    @Query("SELECT DISTINCT d.specialization FROM Doctor d WHERE d.active = true ORDER BY d.specialization ASC")
    List<String> findDistinctSpecializations();

    long countByActiveTrue();
}
