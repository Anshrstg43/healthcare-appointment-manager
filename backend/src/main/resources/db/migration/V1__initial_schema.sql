-- =============================================================================
-- Healthcare Appointment & Follow-up Manager - Initial Database Schema (V1)
-- =============================================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(20) NOT NULL, -- 'PATIENT', 'DOCTOR', 'ADMIN'
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. DOCTORS
CREATE TABLE IF NOT EXISTS doctors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    bio TEXT,
    qualifications VARCHAR(255),
    experience_years INT DEFAULT 0,
    working_schedule JSON, -- stores Monday-Sunday start/end times
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_doctors_specialization (specialization),
    INDEX idx_doctors_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. DOCTOR LEAVES
CREATE TABLE IF NOT EXISTS doctor_leaves (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    leave_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_leaves_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE,
    UNIQUE KEY uq_doctor_leave_date (doctor_id, leave_date),
    INDEX idx_leaves_doctor_date (doctor_id, leave_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(30) NOT NULL, -- 'HELD', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'
    symptoms_text TEXT,
    clinical_notes TEXT,
    hold_expires_at TIMESTAMP NULL,
    calendar_synced BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE,
    INDEX idx_appt_doc_date_time (doctor_id, appointment_date, start_time),
    INDEX idx_appt_patient (patient_id),
    INDEX idx_appt_status (status),
    INDEX idx_appt_hold_expires (hold_expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. AI SUMMARIES (Pre-visit and Post-visit)
CREATE TABLE IF NOT EXISTS ai_summaries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    summary_type VARCHAR(30) NOT NULL, -- 'PRE_VISIT', 'POST_VISIT'
    urgency VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH'
    chief_complaint VARCHAR(255),
    suggested_questions JSON,
    summary_text TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED'
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_summaries_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE,
    INDEX idx_ai_summary_appt_type (appointment_id, summary_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL UNIQUE,
    follow_up_instructions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescriptions_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PRESCRIPTION ITEMS
CREATE TABLE IF NOT EXISTS prescription_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL, -- e.g. 'Once daily', 'Twice daily', 'Thrice daily'
    duration VARCHAR(50) NOT NULL,  -- e.g. '5 days'
    instructions VARCHAR(255),
    CONSTRAINT fk_prescription_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. MEDICATION REMINDERS
CREATE TABLE IF NOT EXISTS medication_reminders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_item_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED'
    retry_count INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    error_message VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reminders_item FOREIGN KEY (prescription_item_id) REFERENCES prescription_items (id) ON DELETE CASCADE,
    CONSTRAINT fk_reminders_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    INDEX idx_reminders_status_scheduled (status, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NULL,
    recipient_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'APPOINTMENT_CONFIRMATION', 'APPOINTMENT_REMINDER', 'APPOINTMENT_CANCELLATION', 'DOCTOR_LEAVE_IMPACT', etc.
    channel VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED'
    sent_at TIMESTAMP NULL,
    retry_count INT NOT NULL DEFAULT 0,
    error_message VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_notifications_status (status, retry_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS calendar_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    google_event_id VARCHAR(255),
    sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SYNCED', 'FAILED'
    error_message VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_calendar_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE,
    CONSTRAINT fk_calendar_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_calendar_event_appt (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
