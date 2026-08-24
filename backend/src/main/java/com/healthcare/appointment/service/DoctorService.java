package com.healthcare.appointment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.appointment.dto.*;
import com.healthcare.appointment.entity.Appointment;
import com.healthcare.appointment.entity.Doctor;
import com.healthcare.appointment.exception.ResourceNotFoundException;
import com.healthcare.appointment.mapper.EntityMapper;
import com.healthcare.appointment.repository.AppointmentRepository;
import com.healthcare.appointment.repository.DoctorLeaveRepository;
import com.healthcare.appointment.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorLeaveRepository doctorLeaveRepository;
    private final AppointmentRepository appointmentRepository;
    private final EntityMapper entityMapper;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<DoctorDto> searchDoctors(String specialization, String name, Pageable pageable) {
        Page<Doctor> page = doctorRepository.searchDoctors(
            (specialization != null && !specialization.isBlank()) ? specialization : null,
            (name != null && !name.isBlank()) ? name : null,
            pageable
        );
        return page.map(entityMapper::toDoctorDto);
    }

    @Transactional(readOnly = true)
    public DoctorDto getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor", id));
        return entityMapper.toDoctorDto(doctor);
    }

    @Transactional(readOnly = true)
    public List<String> getSpecializations() {
        return doctorRepository.findDistinctSpecializations();
    }

    /**
     * Calculates available time slots for a given doctor and date based on:
     * 1. Doctor's working hours for the day of week
     * 2. Slot duration
     * 3. Doctor leave
     * 4. Active appointments (HELD, CONFIRMED)
     * 5. Past time threshold if date is today
     */
    @Transactional(readOnly = true)
    public List<TimeSlotDto> getDoctorAvailability(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor", doctorId));

        if (!doctor.isActive()) {
            return Collections.emptyList();
        }

        // 1. Check if doctor is on leave on this date
        boolean isOnLeave = doctorLeaveRepository.existsByDoctorIdAndLeaveDate(doctorId, date);
        if (isOnLeave) {
            log.debug("Doctor {} is on leave on {}", doctorId, date);
            return Collections.emptyList();
        }

        // 2. Parse working schedule
        WorkingScheduleDto schedule = null;
        if (doctor.getWorkingSchedule() != null && !doctor.getWorkingSchedule().isBlank()) {
            try {
                schedule = objectMapper.readValue(doctor.getWorkingSchedule(), WorkingScheduleDto.class);
            } catch (Exception e) {
                log.warn("Failed to parse schedule for doctor {}: {}", doctorId, e.getMessage());
            }
        }

        WorkingHoursDto hours = getWorkingHoursForDay(schedule, date.getDayOfWeek());
        if (hours == null || hours.getStart() == null || hours.getEnd() == null) {
            // Default 09:00 - 17:00 on weekdays if not explicitly configured
            if (date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY) {
                hours = new WorkingHoursDto("09:00", "17:00");
            } else {
                return Collections.emptyList(); // Closed on weekends by default
            }
        }

        LocalTime dayStart = LocalTime.parse(hours.getStart());
        LocalTime dayEnd = LocalTime.parse(hours.getEnd());
        int slotMinutes = doctor.getSlotDurationMinutes() != null && doctor.getSlotDurationMinutes() > 0
            ? doctor.getSlotDurationMinutes() : 30;

        // 3. Fetch existing active bookings on this date
        List<Appointment> existingAppts = appointmentRepository.findActiveDoctorAppointmentsOnDate(doctorId, date);
        Set<LocalTime> bookedStartTimes = new HashSet<>();
        for (Appointment appt : existingAppts) {
            bookedStartTimes.add(appt.getStartTime());
        }

        // 4. Generate slots
        List<TimeSlotDto> slots = new ArrayList<>();
        LocalTime current = dayStart;
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        while (current.plusMinutes(slotMinutes).compareTo(dayEnd) <= 0) {
            LocalTime slotEnd = current.plusMinutes(slotMinutes);
            boolean isBooked = bookedStartTimes.contains(current);
            boolean isPast = date.isBefore(today) || (date.isEqual(today) && current.isBefore(now));

            boolean available = !isBooked && !isPast;
            String reason = null;
            if (isPast) reason = "PAST";
            else if (isBooked) reason = "BOOKED";

            slots.add(TimeSlotDto.builder()
                .startTime(current)
                .endTime(slotEnd)
                .available(available)
                .reason(reason)
                .build());

            current = slotEnd;
        }

        return slots;
    }

    private WorkingHoursDto getWorkingHoursForDay(WorkingScheduleDto schedule, DayOfWeek dayOfWeek) {
        if (schedule == null) return null;
        return switch (dayOfWeek) {
            case MONDAY -> schedule.getMonday();
            case TUESDAY -> schedule.getTuesday();
            case WEDNESDAY -> schedule.getWednesday();
            case THURSDAY -> schedule.getThursday();
            case FRIDAY -> schedule.getFriday();
            case SATURDAY -> schedule.getSaturday();
            case SUNDAY -> schedule.getSunday();
        };
    }
}
