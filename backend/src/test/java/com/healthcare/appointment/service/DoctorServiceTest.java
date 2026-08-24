package com.healthcare.appointment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.appointment.dto.DoctorDto;
import com.healthcare.appointment.dto.TimeSlotDto;
import com.healthcare.appointment.entity.*;
import com.healthcare.appointment.mapper.EntityMapper;
import com.healthcare.appointment.repository.AppointmentRepository;
import com.healthcare.appointment.repository.DoctorLeaveRepository;
import com.healthcare.appointment.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private DoctorLeaveRepository doctorLeaveRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private EntityMapper entityMapper;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private DoctorService doctorService;

    private Doctor doctor;
    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(2L)
                .name("Dr. Sarah Jenkins")
                .email("dr.jenkins@healthcare.com")
                .role(Role.DOCTOR)
                .active(true)
                .build();

        doctor = Doctor.builder()
                .id(1L)
                .user(user)
                .specialization("Cardiology")
                .slotDurationMinutes(30)
                .active(true)
                .workingSchedule("{\"monday\":{\"start\":\"09:00\",\"end\":\"12:00\"}}")
                .build();
    }

    @Test
    @DisplayName("Should return available slots for working day when no leaves exist")
    void testGetAvailableSlots_Success() {
        LocalDate nextMonday = LocalDate.now().plusWeeks(1);
        while (nextMonday.getDayOfWeek() != java.time.DayOfWeek.MONDAY) {
            nextMonday = nextMonday.plusDays(1);
        }

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorLeaveRepository.existsByDoctorIdAndLeaveDate(1L, nextMonday)).thenReturn(false);
        when(appointmentRepository.findActiveDoctorAppointmentsOnDate(1L, nextMonday)).thenReturn(List.of());

        List<TimeSlotDto> slots = doctorService.getDoctorAvailability(1L, nextMonday);

        assertThat(slots).isNotEmpty();
        assertThat(slots).allMatch(TimeSlotDto::isAvailable);
        assertThat(slots.get(0).getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(slots.get(0).getEndTime()).isEqualTo(LocalTime.of(9, 30));
    }

    @Test
    @DisplayName("Should return empty list when doctor is on leave")
    void testGetAvailableSlots_DoctorOnLeave() {
        LocalDate monday = LocalDate.now().plusDays(7);
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorLeaveRepository.existsByDoctorIdAndLeaveDate(1L, monday)).thenReturn(true);

        List<TimeSlotDto> slots = doctorService.getDoctorAvailability(1L, monday);

        assertThat(slots).isEmpty();
    }

    @Test
    @DisplayName("Should search active doctors by specialization")
    void testSearchDoctors() {
        DoctorDto dto = DoctorDto.builder().id(1L).name("Dr. Sarah Jenkins").specialization("Cardiology").build();
        when(doctorRepository.searchDoctors(eq("Cardiology"), isNull(), any())).thenReturn(new PageImpl<>(List.of(doctor)));
        when(entityMapper.toDoctorDto(doctor)).thenReturn(dto);

        Page<DoctorDto> result = doctorService.searchDoctors("Cardiology", null, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getSpecialization()).isEqualTo("Cardiology");
    }
}
