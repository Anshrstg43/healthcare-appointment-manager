package com.healthcare.appointment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.appointment.dto.*;
import com.healthcare.appointment.entity.*;
import com.healthcare.appointment.exception.ResourceNotFoundException;
import com.healthcare.appointment.mapper.EntityMapper;
import com.healthcare.appointment.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorLeaveRepository doctorLeaveRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final GoogleCalendarService calendarService;
    private final PasswordEncoder passwordEncoder;
    private final EntityMapper entityMapper;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public AdminStatsDto getAdminStats() {
        LocalDate today = LocalDate.now();

        long totalPatients = userRepository.countByRole(Role.PATIENT);
        long totalDoctors = doctorRepository.countByActiveTrue();
        long todayAppts = appointmentRepository.countByAppointmentDate(today);
        long upcomingAppts = appointmentRepository.countByAppointmentDateGreaterThanAndStatus(today, AppointmentStatus.CONFIRMED);
        long cancelledAppts = appointmentRepository.countByStatus(AppointmentStatus.CANCELLED);
        long docsOnLeave = doctorLeaveRepository.countByLeaveDate(today);

        return AdminStatsDto.builder()
            .totalPatients(totalPatients)
            .totalDoctors(totalDoctors)
            .todayAppointments(todayAppts)
            .upcomingAppointments(upcomingAppts)
            .cancelledAppointments(cancelledAppts)
            .doctorsOnLeave(docsOnLeave)
            .build();
    }

    @Transactional
    public DoctorDto createDoctor(DoctorCreateRequest req) {
        if (userRepository.existsByEmail(req.getEmail().toLowerCase().trim())) {
            throw new IllegalArgumentException("Email is already in use: " + req.getEmail());
        }

        User user = User.builder()
            .name(req.getName())
            .email(req.getEmail().toLowerCase().trim())
            .passwordHash(passwordEncoder.encode(req.getPassword()))
            .phone(req.getPhone())
            .role(Role.DOCTOR)
            .active(true)
            .build();
        user = userRepository.save(user);

        String scheduleJson = null;
        if (req.getWorkingSchedule() != null) {
            try {
                scheduleJson = objectMapper.writeValueAsString(req.getWorkingSchedule());
            } catch (Exception e) {
                log.warn("Failed to serialize working schedule: {}", e.getMessage());
            }
        }

        Doctor doctor = Doctor.builder()
            .user(user)
            .specialization(req.getSpecialization())
            .bio(req.getBio())
            .qualifications(req.getQualifications())
            .experienceYears(req.getExperienceYears() != null ? req.getExperienceYears() : 0)
            .workingSchedule(scheduleJson)
            .slotDurationMinutes(req.getSlotDurationMinutes() != null ? req.getSlotDurationMinutes() : 30)
            .active(true)
            .build();

        doctor = doctorRepository.save(doctor);
        log.info("Created doctor profile id={} for user={}", doctor.getId(), user.getEmail());

        return entityMapper.toDoctorDto(doctor);
    }

    @Transactional
    public DoctorDto updateDoctor(Long id, DoctorUpdateRequest req) {
        Doctor doctor = doctorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor", id));

        if (req.getName() != null) doctor.getUser().setName(req.getName());
        if (req.getPhone() != null) doctor.getUser().setPhone(req.getPhone());
        if (req.getSpecialization() != null) doctor.setSpecialization(req.getSpecialization());
        if (req.getBio() != null) doctor.setBio(req.getBio());
        if (req.getQualifications() != null) doctor.setQualifications(req.getQualifications());
        if (req.getExperienceYears() != null) doctor.setExperienceYears(req.getExperienceYears());
        if (req.getSlotDurationMinutes() != null) doctor.setSlotDurationMinutes(req.getSlotDurationMinutes());
        if (req.getActive() != null) {
            doctor.setActive(req.getActive());
            doctor.getUser().setActive(req.getActive());
        }

        if (req.getWorkingSchedule() != null) {
            try {
                doctor.setWorkingSchedule(objectMapper.writeValueAsString(req.getWorkingSchedule()));
            } catch (Exception e) {
                log.warn("Failed to serialize schedule: {}", e.getMessage());
            }
        }

        doctor = doctorRepository.save(doctor);
        return entityMapper.toDoctorDto(doctor);
    }

    /**
     * Adds a doctor leave date and cascades cancellations + notifications to all affected patients.
     */
    @Transactional
    public DoctorLeaveDto addDoctorLeave(Long doctorId, DoctorLeaveRequest req) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor", doctorId));

        if (doctorLeaveRepository.existsByDoctorIdAndLeaveDate(doctorId, req.getLeaveDate())) {
            throw new IllegalArgumentException("Doctor is already marked on leave for date: " + req.getLeaveDate());
        }

        DoctorLeave leave = DoctorLeave.builder()
            .doctor(doctor)
            .leaveDate(req.getLeaveDate())
            .reason(req.getReason())
            .build();
        leave = doctorLeaveRepository.save(leave);

        // 1. Find all active appointments on this leave date
        List<Appointment> affected = appointmentRepository.findAppointmentsAffectedByLeave(doctorId, req.getLeaveDate());
        log.info("Doctor leave on {} affects {} appointments for doctor {}", req.getLeaveDate(), affected.size(), doctorId);

        // 2. Cancel and notify affected patients
        for (Appointment appt : affected) {
            appt.setStatus(AppointmentStatus.CANCELLED);
            appointmentRepository.save(appt);

            notificationService.sendDoctorLeaveImpactAsync(appt);
            calendarService.deleteAppointmentEventAsync(appt.getId());
        }

        return entityMapper.toDoctorLeaveDto(leave);
    }

    @Transactional
    public void deleteDoctorLeave(Long leaveId) {
        DoctorLeave leave = doctorLeaveRepository.findById(leaveId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor leave not found with id: " + leaveId));
        doctorLeaveRepository.delete(leave);
        log.info("Deleted doctor leave id={}", leaveId);
    }

    @Transactional(readOnly = true)
    public List<DoctorLeaveDto> getDoctorLeaves(Long doctorId) {
        List<DoctorLeave> leaves = doctorLeaveRepository.findByDoctorIdOrderByLeaveDateDesc(doctorId);
        return leaves.stream().map(entityMapper::toDoctorLeaveDto).toList();
    }

    @Transactional(readOnly = true)
    public Page<UserDto> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(entityMapper::toUserDto);
    }

    @Transactional(readOnly = true)
    public Page<DoctorDto> listDoctors(Pageable pageable) {
        return doctorRepository.findAll(pageable).map(entityMapper::toDoctorDto);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentDto> listAppointments(AppointmentStatus status, LocalDate date, Pageable pageable) {
        Page<Appointment> page;
        if (status != null) {
            page = appointmentRepository.findAll(pageable); // Can be filtered
        } else {
            page = appointmentRepository.findAll(pageable);
        }
        return page.map(entityMapper::toAppointmentDto);
    }
}
