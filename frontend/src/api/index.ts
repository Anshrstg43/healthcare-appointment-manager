import apiClient from './client';
import type {
  AuthTokens,
  Doctor,
  TimeSlot,
  Appointment,
  AiSummary,
  AdminStats,
  DoctorStats,
  PatientStats,
  PageResponse,
  DoctorLeave,
  User,
} from '../types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone: string }) =>
    apiClient.post<AuthTokens>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthTokens>('/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }),

  logout: () =>
    apiClient.post('/auth/logout'),
};

// ─── Doctors ─────────────────────────────────────────────────────────────────
export const doctorApi = {
  search: (params?: { specialization?: string; name?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<Doctor>>('/doctors', { params }),

  getById: (id: number) =>
    apiClient.get<Doctor>(`/doctors/${id}`),

  getAvailability: (doctorId: number, date: string) =>
    apiClient.get<TimeSlot[]>(`/doctors/${doctorId}/availability`, { params: { date } }),
};

// ─── Patient Appointments ─────────────────────────────────────────────────────
export const appointmentApi = {
  create: (data: {
    doctorId: number;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    symptomsText?: string;
  }) => apiClient.post<Appointment>('/appointments', data),

  list: (params?: { status?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<Appointment>>('/appointments', { params }),

  getById: (id: number) =>
    apiClient.get<Appointment>(`/appointments/${id}`),

  submitSymptoms: (id: number, symptomsText: string) =>
    apiClient.post<void>(`/appointments/${id}/symptoms`, { symptomsText }),

  getAiSummary: (id: number) =>
    apiClient.get<AiSummary>(`/appointments/${id}/ai-summary`),

  reschedule: (id: number, data: { appointmentDate: string; startTime: string; endTime: string }) =>
    apiClient.put<Appointment>(`/appointments/${id}/reschedule`, data),

  cancel: (id: number) =>
    apiClient.post<void>(`/appointments/${id}/cancel`),
};

// ─── Doctor Portal ────────────────────────────────────────────────────────────
export const doctorPortalApi = {
  getAppointments: (params?: { status?: string; date?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<Appointment>>('/doctor/appointments', { params }),

  getAppointmentById: (id: number) =>
    apiClient.get<Appointment>(`/doctor/appointments/${id}`),

  addNotes: (id: number, clinicalNotes: string) =>
    apiClient.post<void>(`/doctor/appointments/${id}/notes`, { clinicalNotes }),

  addPrescription: (id: number, data: {
    items: Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    followUpInstructions?: string;
  }) => apiClient.post<void>(`/doctor/appointments/${id}/prescription`, data),

  complete: (id: number) =>
    apiClient.post<Appointment>(`/doctor/appointments/${id}/complete`),

  getStats: () =>
    apiClient.get<DoctorStats>('/doctor/stats'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () =>
    apiClient.get<AdminStats>('/admin/stats'),

  listUsers: (params?: { page?: number; size?: number }) =>
    apiClient.get<PageResponse<User>>('/admin/users', { params }),

  listDoctors: (params?: { page?: number; size?: number }) =>
    apiClient.get<PageResponse<Doctor>>('/admin/doctors', { params }),

  createDoctor: (data: Partial<Doctor> & { password: string; phone?: string }) =>
    apiClient.post<Doctor>('/admin/doctors', data),

  updateDoctor: (id: number, data: Partial<Doctor>) =>
    apiClient.put<Doctor>(`/admin/doctors/${id}`, data),

  getDoctorLeaves: (doctorId: number) =>
    apiClient.get<DoctorLeave[]>(`/admin/doctors/${doctorId}/leave`),

  addLeave: (doctorId: number, data: { leaveDate: string; reason?: string }) =>
    apiClient.post<DoctorLeave>(`/admin/doctors/${doctorId}/leave`, data),

  deleteLeave: (leaveId: number) =>
    apiClient.delete(`/admin/leave/${leaveId}`),

  listAppointments: (params?: { status?: string; date?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<Appointment>>('/admin/appointments', { params }),
};

// ─── Calendar ────────────────────────────────────────────────────────────────
export const calendarApi = {
  connect: () =>
    apiClient.get<{ authUrl: string }>('/calendar/connect'),

  sync: (appointmentId: number) =>
    apiClient.post<void>(`/calendar/sync/${appointmentId}`),
};

// ─── Patient Stats ────────────────────────────────────────────────────────────
export const patientApi = {
  getStats: () =>
    apiClient.get<PatientStats>('/patient/stats'),
};
