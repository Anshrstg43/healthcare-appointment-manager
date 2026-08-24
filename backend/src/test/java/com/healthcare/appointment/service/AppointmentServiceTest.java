package com.healthcare.appointment.service;

import com.healthcare.appointment.dto.AppointmentCreateRequest;
import com.healthcare.appointment.dto.AppointmentDto;
import com.healthcare.appointment.entity.*;
import com.healthcare.appointment.exception.DoctorOnLeaveException;
import com.healthcare.appointment.exception.SlotUnavailableException;
import com.healthcare.appointment.mapper.EntityMapper;
import com.healthcare.appointment.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private DoctorLeaveRepository doctorLeaveRepository;
    @Mock private AiSummaryService aiSummaryService;
    @Mock private NotificationService notificationService;
    @Mock private GoogleCalendarService calendarService;
    @Mock private EntityMapper entityMapper;

    @InjectMocks
    private AppointmentService appointmentService;

    private Patient mockPatient;
    private Doctor mockDoctor;
    private User mockPatientUser;
    private User mockDoctorUser;

    @BeforeEach
    void setUp() {
        mockPatientUser = User.builder().id(1L).email("patient@test.com").name("Patient Test").role(Role.PATIENT).build();
        mockPatient = Patient.builder().id(1L).user(mockPatientUser).build();

        mockDoctorUser = User.builder().id(2L).email("doctor@test.com").name("Doctor Test").role(Role.DOCTOR).build();
        mockDoctor = Doctor.builder().id(1L).user(mockDoctorUser).specialization("Cardiology").active(true).build();
    }

    @Test
    @DisplayName("Should successfully book appointment when slot is available")
    void testBookAppointmentSuccess() {
        AppointmentCreateRequest req = new AppointmentCreateRequest();
        req.setDoctorId(1L);
        req.setAppointmentDate(LocalDate.now().plusDays(1));
        req.setStartTime(LocalTime.of(10, 0));
        req.setEndTime(LocalTime.of(10, 30));
        req.setSymptomsText("Mild fever");

        when(patientRepository.findByUserEmail("patient@test.com")).thenReturn(Optional.of(mockPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(mockDoctor));
        when(doctorLeaveRepository.existsByDoctorIdAndLeaveDate(1L, req.getAppointmentDate())).thenReturn(false);
        when(appointmentRepository.findActiveOverlappingAppointmentsForUpdate(1L, req.getAppointmentDate(), req.getStartTime()))
            .thenReturn(Collections.emptyList());

        Appointment savedAppt = Appointment.builder()
            .id(100L)
            .patient(mockPatient)
            .doctor(mockDoctor)
            .appointmentDate(req.getAppointmentDate())
            .startTime(req.getStartTime())
            .endTime(req.getEndTime())
            .status(AppointmentStatus.CONFIRMED)
            .build();

        when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedAppt);
        when(entityMapper.toAppointmentDto(any())).thenReturn(AppointmentDto.builder().id(100L).status(AppointmentStatus.CONFIRMED).build());

        AppointmentDto result = appointmentService.bookAppointment("patient@test.com", req);

        assertNotNull(result);
        assertEquals(AppointmentStatus.CONFIRMED, result.getStatus());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
        verify(aiSummaryService, times(1)).generatePreVisitSummaryAsync(eq(100L), eq("Mild fever"));
        verify(notificationService, times(1)).sendAppointmentConfirmationAsync(100L);
    }

    @Test
    @DisplayName("Should throw SlotUnavailableException (HTTP 409) on simultaneous double booking conflict")
    void testDoubleBookingConflictThrowsException() {
        AppointmentCreateRequest req = new AppointmentCreateRequest();
        req.setDoctorId(1L);
        req.setAppointmentDate(LocalDate.now().plusDays(1));
        req.setStartTime(LocalTime.of(10, 0));
        req.setEndTime(LocalTime.of(10, 30));

        when(patientRepository.findByUserEmail("patient@test.com")).thenReturn(Optional.of(mockPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(mockDoctor));
        when(doctorLeaveRepository.existsByDoctorIdAndLeaveDate(1L, req.getAppointmentDate())).thenReturn(false);

        // Simulate conflicting active booking found by pessimistic lock
        Appointment conflict = Appointment.builder().id(99L).status(AppointmentStatus.CONFIRMED).build();
        when(appointmentRepository.findActiveOverlappingAppointmentsForUpdate(1L, req.getAppointmentDate(), req.getStartTime()))
            .thenReturn(List.of(conflict));

        assertThrows(SlotUnavailableException.class, () ->
            appointmentService.bookAppointment("patient@test.com", req)
        );

        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Should throw DoctorOnLeaveException when booking during doctor leave")
    void testBookingDuringDoctorLeaveThrowsException() {
        AppointmentCreateRequest req = new AppointmentCreateRequest();
        req.setDoctorId(1L);
        req.setAppointmentDate(LocalDate.now().plusDays(2));
        req.setStartTime(LocalTime.of(11, 0));
        req.setEndTime(LocalTime.of(11, 30));

        when(patientRepository.findByUserEmail("patient@test.com")).thenReturn(Optional.of(mockPatient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(mockDoctor));
        when(doctorLeaveRepository.existsByDoctorIdAndLeaveDate(1L, req.getAppointmentDate())).thenReturn(true);

        assertThrows(DoctorOnLeaveException.class, () ->
            appointmentService.bookAppointment("patient@test.com", req)
        );
    }
}
