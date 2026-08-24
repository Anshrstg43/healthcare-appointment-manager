package com.healthcare.appointment.service;

import com.healthcare.appointment.dto.*;
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
class ConsultationServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private PrescriptionRepository prescriptionRepository;
    @Mock
    private MedicationReminderRepository reminderRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private AiSummaryService aiSummaryService;
    @Mock
    private EntityMapper entityMapper;

    @InjectMocks
    private ConsultationService consultationService;

    private Appointment appointment;
    private Patient patient;
    private Doctor doctor;
    private User docUser;

    @BeforeEach
    void setUp() {
        User patientUser = User.builder().id(10L).name("Alex Morgan").email("alex@healthcare.com").build();
        patient = Patient.builder().id(1L).user(patientUser).build();

        docUser = User.builder().id(20L).name("Dr. Sarah Jenkins").email("dr.jenkins@healthcare.com").build();
        doctor = Doctor.builder().id(2L).user(docUser).specialization("Cardiology").build();

        appointment = Appointment.builder()
                .id(100L)
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(LocalDate.now())
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .status(AppointmentStatus.CONFIRMED)
                .build();
    }

    @Test
    @DisplayName("Should add clinical consultation notes successfully")
    void testAddClinicalNotes() {
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        consultationService.addClinicalNotes(100L, "dr.jenkins@healthcare.com", "Patient reports mild chest tightness. ECG normal.");

        assertThat(appointment.getClinicalNotes()).isEqualTo("Patient reports mild chest tightness. ECG normal.");
        verify(appointmentRepository).save(appointment);
    }

    @Test
    @DisplayName("Should create prescription and schedule medication reminders")
    void testAddPrescription() {
        PrescriptionItemDto item = PrescriptionItemDto.builder()
                .medicineName("Amoxicillin")
                .dosage("500mg")
                .frequency("Three times daily")
                .duration("7 days")
                .instructions("After meals")
                .build();

        PrescriptionCreateRequest req = new PrescriptionCreateRequest();
        req.setItems(List.of(item));
        req.setFollowUpInstructions("Return if fever returns");

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(prescriptionRepository.findByAppointmentId(100L)).thenReturn(Optional.empty());
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(i -> i.getArgument(0));

        PrescriptionDto dummyDto = PrescriptionDto.builder().id(1L).items(List.of(item)).build();
        when(entityMapper.toPrescriptionDto(any())).thenReturn(dummyDto);

        PrescriptionDto result = consultationService.addPrescription(100L, "dr.jenkins@healthcare.com", req);

        assertThat(result).isNotNull();
        verify(reminderRepository, atLeastOnce()).save(any(MedicationReminder.class));
    }

    @Test
    @DisplayName("Should complete appointment and trigger post-visit AI summary")
    void testCompleteAppointment() {
        appointment.setClinicalNotes("Blood pressure 120/80. Condition stable.");
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        AppointmentDto dummyDto = AppointmentDto.builder().id(100L).status(AppointmentStatus.COMPLETED).build();
        when(entityMapper.toAppointmentDto(any())).thenReturn(dummyDto);

        AppointmentDto result = consultationService.completeAppointment(100L, "dr.jenkins@healthcare.com");

        assertThat(result).isNotNull();
        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.COMPLETED);
        verify(aiSummaryService).generatePostVisitSummaryAsync(eq(100L), anyString(), anyString());
    }
}
