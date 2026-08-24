package com.healthcare.appointment.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.appointment.dto.WorkingHoursDto;
import com.healthcare.appointment.dto.WorkingScheduleDto;
import com.healthcare.appointment.entity.*;
import com.healthcare.appointment.repository.DoctorRepository;
import com.healthcare.appointment.repository.PatientRepository;
import com.healthcare.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // 1. Seed Admin
        if (!userRepository.existsByEmail("admin@healthcare.com")) {
            User admin = User.builder()
                .name("System Administrator")
                .email("admin@healthcare.com")
                .passwordHash(passwordEncoder.encode("Admin@123456"))
                .phone("+1-555-0100")
                .role(Role.ADMIN)
                .active(true)
                .build();
            userRepository.save(admin);
            log.info("Default Admin account created: admin@healthcare.com / Admin@123456");
        }

        // 2. Seed Sample Doctors if empty
        if (doctorRepository.count() == 0) {
            WorkingHoursDto weekdayHours = new WorkingHoursDto("09:00", "17:00");
            WorkingScheduleDto schedule = WorkingScheduleDto.builder()
                .monday(weekdayHours)
                .tuesday(weekdayHours)
                .wednesday(weekdayHours)
                .thursday(weekdayHours)
                .friday(weekdayHours)
                .build();
            String scheduleJson = objectMapper.writeValueAsString(schedule);

            seedDoctor("Dr. Sarah Jenkins", "dr.jenkins@healthcare.com", "Doctor@123456", "+1-555-0101",
                "Cardiology", "Board-certified cardiologist with 12+ years of experience specializing in preventive cardiology and heart rhythm disorders.",
                "MD, FACC - Harvard Medical School", 12, scheduleJson, 30);

            seedDoctor("Dr. Robert Chen", "dr.chen@healthcare.com", "Doctor@123456", "+1-555-0102",
                "Dermatology", "Expert in clinical and surgical dermatology, eczema, acne management, and skin cancer screening.",
                "MD, FAAD - Johns Hopkins University", 9, scheduleJson, 30);

            seedDoctor("Dr. Emily Rodriguez", "dr.rodriguez@healthcare.com", "Doctor@123456", "+1-555-0103",
                "Pediatrics", "Compassionate pediatrician dedicated to newborn care, childhood developmental milestones, and pediatric wellness.",
                "MD, FAAP - Stanford University School of Medicine", 15, scheduleJson, 30);

            seedDoctor("Dr. Michael Patel", "dr.patel@healthcare.com", "Doctor@123456", "+1-555-0104",
                "Neurology", "Specialist in headache disorders, epilepsy, and neurological health with patient-centered approaches.",
                "MD, PhD - Columbia University", 8, scheduleJson, 30);

            log.info("Seeded 4 default doctor profiles with schedule Monday-Friday 09:00-17:00");
        }

        // 3. Seed Sample Patient for immediate demo
        if (!userRepository.existsByEmail("patient@healthcare.com")) {
            User patientUser = User.builder()
                .name("Alex Morgan")
                .email("patient@healthcare.com")
                .passwordHash(passwordEncoder.encode("Patient@123456"))
                .phone("+1-555-0199")
                .role(Role.PATIENT)
                .active(true)
                .build();
            patientUser = userRepository.save(patientUser);

            Patient patient = Patient.builder().user(patientUser).build();
            patientRepository.save(patient);
            log.info("Default Patient account created: patient@healthcare.com / Patient@123456");
        }
    }

    private void seedDoctor(String name, String email, String password, String phone,
                            String specialization, String bio, String qualifications,
                            int experienceYears, String scheduleJson, int slotDuration) {
        User user = User.builder()
            .name(name)
            .email(email)
            .passwordHash(passwordEncoder.encode(password))
            .phone(phone)
            .role(Role.DOCTOR)
            .active(true)
            .build();
        user = userRepository.save(user);

        Doctor doctor = Doctor.builder()
            .user(user)
            .specialization(specialization)
            .bio(bio)
            .qualifications(qualifications)
            .experienceYears(experienceYears)
            .workingSchedule(scheduleJson)
            .slotDurationMinutes(slotDuration)
            .active(true)
            .build();
        doctorRepository.save(doctor);
    }
}
