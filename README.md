# Healthcare Appointment & Follow-up Manager

> Production-quality, full-stack healthcare appointment platform with AI-assisted pre- and post-visit summaries, Google Calendar synchronization, automated medication reminders, and concurrency-protected slot scheduling.

---

## 🌟 Key Features

### 👤 Patient Portal
* **Doctor Search & Specialty Filters:** Real-time search across medical specialties with verified doctor profiles, qualifications, and bios.
* **Smart Availability Engine:** Real-time slot computation based on physician working hours, leave blackouts, and existing appointments.
* **Zero Double-Booking Guarantee:** Transactional booking protected by database-level pessimistic locking (`PESSIMISTIC_WRITE`) and concurrency conflict handling (HTTP 409).
* **AI Pre-Visit Intake:** Patient-reported symptoms are triaged by OpenAI GPT-4o into urgency levels, chief complaints, and suggested questions for the physician.
* **Appointment Management:** View upcoming & past visits, one-click rescheduling, and cancellation.
* **Google Calendar Synchronization:** OAuth 2.0 integration to sync confirmed visits directly to Google Calendar.
* **Digital Prescriptions & Medication Reminders:** Access prescriptions online and receive automated scheduled email reminders based on dosage frequency.

### 🩺 Doctor Portal
* **Clinical Dashboard:** Real-time view of today's schedule, patient intake queue, and metrics.
* **AI-Assisted Consultation Console:** Review AI pre-visit intake triage, suggested diagnostic questions, and patient history before examining the patient.
* **Clinical Notes & Prescription Builder:** Structured clinical notes editor and multi-item prescription builder (dosage, frequency, duration, instructions).
* **Automated Post-Visit AI Summaries:** Generates clear, simplified patient-friendly visit summaries and follow-up precautions from physician notes.

### 🛡️ Admin Portal
* **Physician Management:** Register new doctor accounts, configure practice specializations, and customize slot duration intervals (15, 30, 45, 60 mins).
* **Doctor Leave Engine with Cascade Notifications:** Schedule leave dates with automatic detection and cancellation of conflicting patient appointments and explanatory email notices.
* **Clinic-Wide Oversight:** Real-time operational metrics across registered patients, doctors, scheduled visits, and cancellations.

---

## 🏗️ Architecture & Technology Stack

```
Health Appointment/
├── backend/                       # Spring Boot 3.x (Java 17)
│   ├── src/main/java/com/healthcare/appointment/
│   │   ├── config/                # Security, WebClient, Auditing, OpenAPI, Seeders
│   │   ├── controller/            # REST API Controllers (Auth, Doctors, Appointments, etc.)
│   │   ├── dto/                   # Request / Response Data Transfer Objects
│   │   ├── entity/                # JPA Database Entities
│   │   ├── exception/             # Centralized Global Exception Handler
│   │   ├── mapper/                # Entity <-> DTO Mappers with Jackson JSON processing
│   │   ├── repository/            # Spring Data JPA Repositories (Pessimistic Locks)
│   │   ├── scheduler/             # Medication Reminders & Hold Expiry Cron Jobs
│   │   ├── security/              # JWT Provider, Auth Filter, UserDetailsService
│   │   └── service/               # Core Business Logic & AI / Email / Calendar Integrations
│   ├── src/main/resources/
│   │   ├── application.yml        # Application configuration & env placeholders
│   │   └── db/migration/          # Flyway V1 database schema migration
│   └── pom.xml                    # Maven dependencies
│
├── frontend/                      # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── api/                   # Axios API client with JWT interceptors & token refresh
│   │   ├── components/            # Shared UI: Toaster, Badges, Skeletons, Sidebars, Navbars
│   │   ├── layouts/               # Public, Patient, Doctor, and Admin layout wrappers
│   │   ├── pages/                 # Patient, Doctor, Admin, and Public views
│   │   ├── routes/                # Role-based protected routes
│   │   ├── store/                 # Zustand persistent auth store
│   │   └── types/                 # TypeScript entity & API definitions
│   ├── tailwind.config.js         # Healthcare color palette & styling tokens
│   └── vite.config.ts             # Vite build configuration & API proxy
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* **Java 17+** and **Maven 3.8+**
* **Node.js 18+** and **npm**
* **MySQL 8.0+**

### 1. Database Setup
Create a MySQL database:
```sql
CREATE DATABASE healthcare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Configuration
Copy `.env.example` to `backend/.env` (or set system environment variables):
```bash
cp backend/.env.example backend/.env
```

Key environment variables:
```properties
DB_URL=jdbc:mysql://localhost:3306/healthcare_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your-base64-encoded-512-bit-secret-key-here
OPENAI_API_KEY=sk-...               # Optional: Simulated responses generated if blank
MAIL_HOST=smtp.gmail.com           # Optional: Configurable SMTP
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Run the backend:
```bash
cd backend
mvn spring-boot:run
```
* Backend API starts at: `http://localhost:8080`
* Swagger UI documentation: `http://localhost:8080/swagger-ui.html`

### 3. Frontend Configuration & Launch
```bash
cd frontend
npm install
npm run dev
```
* Frontend starts at: `http://localhost:5173`

---

## 🔑 Default Seeded Demo Accounts

On startup, the system seeds demo accounts for immediate testing:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@healthcare.com` | `Admin@123456` |
| **Doctor (Cardiology)** | `dr.jenkins@healthcare.com` | `Doctor@123456` |
| **Doctor (Dermatology)** | `dr.chen@healthcare.com` | `Doctor@123456` |
| **Patient** | `patient@healthcare.com` | `Patient@123456` |

You can also use the **Demo One-Click Login** buttons on `/login` or register a new patient account on `/register`.

---

## 🧪 Testing

### Backend Unit & Integration Tests
```bash
cd backend
mvn test
```

### Frontend Typecheck & Build
```bash
cd frontend
npm run build
```

---

## 🔒 Security & Healthcare Data Protection
* **Least-Privilege RBAC:** Patient data is isolated by ownership; physicians can only access assigned consultations; administrators have controlled operational access.
* **Concurrency Locking:** Database-level pessimistic write locking prevents race conditions during high-volume booking attempts.
* **Asynchronous Integration Isolation:** AI, email notifications, and Google Calendar sync failures are non-blocking and will never cause booking transactions to fail.
