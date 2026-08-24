// ─── User & Auth ──────────────────────────────────────────────────────────────

export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
}

// ─── Doctor ───────────────────────────────────────────────────────────────────

export interface WorkingHours {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface WorkingSchedule {
  monday?: WorkingHours;
  tuesday?: WorkingHours;
  wednesday?: WorkingHours;
  thursday?: WorkingHours;
  friday?: WorkingHours;
  saturday?: WorkingHours;
  sunday?: WorkingHours;
}

export interface Doctor {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  bio?: string;
  qualifications?: string;
  experienceYears?: number;
  workingSchedule?: WorkingSchedule;
  slotDurationMinutes: number;
  active: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string;   // "09:30"
  available: boolean;
  reason?: string;
}

// ─── Appointment ──────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'HELD'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string; // "2025-08-25"
  startTime: string;       // "10:30"
  endTime: string;         // "11:00"
  status: AppointmentStatus;
  symptomsText?: string;
  clinicalNotes?: string;
  prescription?: Prescription;
  preVisitSummary?: AiSummary;
  postVisitSummary?: AiSummary;
  calendarSynced: boolean;
  holdExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Symptom / AI ────────────────────────────────────────────────────────────

export type AiSummaryType = 'PRE_VISIT' | 'POST_VISIT';
export type AiSummaryStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface AiSummary {
  id: number;
  appointmentId: number;
  type: AiSummaryType;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  chiefComplaint?: string;
  suggestedQuestions?: string[];
  summaryText?: string;
  status: AiSummaryStatus;
  errorMessage?: string;
  createdAt: string;
}

// ─── Prescription ─────────────────────────────────────────────────────────────

export interface PrescriptionItem {
  id?: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id?: number;
  appointmentId: number;
  items: PrescriptionItem[];
  followUpInstructions?: string;
  createdAt?: string;
}

// ─── Doctor Leave ─────────────────────────────────────────────────────────────

export interface DoctorLeave {
  id: number;
  doctorId: number;
  doctorName?: string;
  leaveDate: string;
  reason?: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'APPOINTMENT_CONFIRMATION'
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_CANCELLATION'
  | 'APPOINTMENT_RESCHEDULED'
  | 'DOCTOR_LEAVE_IMPACT'
  | 'MEDICATION_REMINDER';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Notification {
  id: number;
  appointmentId?: number;
  recipientId: number;
  type: NotificationType;
  status: NotificationStatus;
  sentAt?: string;
  retryCount: number;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
  doctorsOnLeave: number;
}

export interface DoctorStats {
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
}

export interface PatientStats {
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
}
