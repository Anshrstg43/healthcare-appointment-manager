package com.healthcare.appointment.service;

import com.healthcare.appointment.dto.DoctorLeaveDto;
import com.healthcare.appointment.dto.DoctorLeaveRequest;
import com.healthcare.appointment.entity.*;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private DoctorLeaveRepository leaveRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private GoogleCalendarService calendarService;
    @Mock
    private EntityMapper entityMapper;

    @InjectMocks
    private AdminService adminService;

    private Doctor doctor;
    private Appointment impactedAppointment;

    @BeforeEach
    void setUp() {
        User docUser = User.builder().id(2L).name("Dr. Sarah Jenkins").email("dr.jenkins@healthcare.com").build();
        doctor = Doctor.builder().id(1L).user(docUser).specialization("Cardiology").build();

        User patientUser = User.builder().id(10L).name("Alex Morgan").email("alex@healthcare.com").build();
        Patient patient = Patient.builder().id(5L).user(patientUser).build();

        impactedAppointment = Appointment.builder()
                .id(200L)
                .doctor(doctor)
                .patient(patient)
                .appointmentDate(LocalDate.of(2026, 9, 1))
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .status(AppointmentStatus.CONFIRMED)
                .build();
    }

    @Test
    @DisplayName("Should add doctor leave, cascade cancel conflicting appointments, and notify affected patients")
    void testAddDoctorLeave_CascadesAndNotifies() {
        LocalDate leaveDate = LocalDate.of(2026, 9, 1);
        DoctorLeaveRequest req = new DoctorLeaveRequest();
        req.setLeaveDate(leaveDate);
        req.setReason("Medical Conference");

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(leaveRepository.existsByDoctorIdAndLeaveDate(1L, leaveDate)).thenReturn(false);
        when(leaveRepository.save(any(DoctorLeave.class))).thenAnswer(i -> i.getArgument(0));
        when(appointmentRepository.findAppointmentsAffectedByLeave(1L, leaveDate)).thenReturn(List.of(impactedAppointment));

        DoctorLeaveDto dummyDto = DoctorLeaveDto.builder().id(1L).doctorId(1L).leaveDate(leaveDate).reason("Medical Conference").build();
        when(entityMapper.toDoctorLeaveDto(any())).thenReturn(dummyDto);

        DoctorLeaveDto result = adminService.addDoctorLeave(1L, req);

        assertThat(result).isNotNull();
        assertThat(result.getReason()).isEqualTo("Medical Conference");
        assertThat(impactedAppointment.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        verify(notificationService).sendDoctorLeaveImpactAsync(impactedAppointment);
    }
}
