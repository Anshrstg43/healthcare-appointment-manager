import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// ─── Layouts (eager) ──────────────────────────────────────────────────────────
import PublicLayout from '../layouts/PublicLayout';
import PatientLayout from '../layouts/PatientLayout';
import DoctorLayout from '../layouts/DoctorLayout';
import AdminLayout from '../layouts/AdminLayout';

// ─── Public Pages (lazy) ──────────────────────────────────────────────────────
const LandingPage      = lazy(() => import('../pages/public/LandingPage'));
const LoginPage        = lazy(() => import('../pages/public/LoginPage'));
const RegisterPage     = lazy(() => import('../pages/public/RegisterPage'));

// ─── Patient Pages (lazy) ─────────────────────────────────────────────────────
const PatientDashboard    = lazy(() => import('../pages/patient/PatientDashboard'));
const DoctorsPage         = lazy(() => import('../pages/patient/DoctorsPage'));
const DoctorProfilePage   = lazy(() => import('../pages/patient/DoctorProfilePage'));
const BookAppointmentPage = lazy(() => import('../pages/patient/BookAppointmentPage'));
const AppointmentsPage    = lazy(() => import('../pages/patient/AppointmentsPage'));
const AppointmentDetail   = lazy(() => import('../pages/patient/AppointmentDetail'));
const PatientProfile      = lazy(() => import('../pages/patient/PatientProfile'));

// ─── Doctor Pages (lazy) ──────────────────────────────────────────────────────
const DoctorDashboard     = lazy(() => import('../pages/doctor/DoctorDashboard'));
const DoctorAppointments  = lazy(() => import('../pages/doctor/DoctorAppointments'));
const DoctorApptDetail    = lazy(() => import('../pages/doctor/DoctorAppointmentDetail'));
const ConsultationPage    = lazy(() => import('../pages/doctor/ConsultationPage'));
const DoctorProfile       = lazy(() => import('../pages/doctor/DoctorProfile'));

// ─── Admin Pages (lazy) ───────────────────────────────────────────────────────
const AdminDashboard      = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers          = lazy(() => import('../pages/admin/AdminUsers'));
const AdminDoctors        = lazy(() => import('../pages/admin/AdminDoctors'));
const AdminDoctorCreate   = lazy(() => import('../pages/admin/AdminDoctorCreate'));
const AdminDoctorEdit     = lazy(() => import('../pages/admin/AdminDoctorEdit'));
const AdminAppointments   = lazy(() => import('../pages/admin/AdminAppointments'));
const AdminLeave          = lazy(() => import('../pages/admin/AdminLeave'));
const TelehealthRoom      = lazy(() => import('../pages/shared/TelehealthRoom'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner size="lg" />
  </div>
);

const AppRouter: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  const defaultDashboard = () => {
    if (!isAuthenticated || !user) return '/login';
    const map: Record<string, string> = {
      PATIENT: '/patient/dashboard',
      DOCTOR: '/doctor/dashboard',
      ADMIN: '/admin/dashboard',
    };
    return map[user.role] || '/login';
  };

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ─── Public ─────────────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={
              isAuthenticated ? <Navigate to={defaultDashboard()} replace /> : <LoginPage />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to={defaultDashboard()} replace /> : <RegisterPage />
            } />
          </Route>

          {/* ─── Patient ────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
            <Route element={<PatientLayout />}>
              <Route path="/patient/dashboard"              element={<PatientDashboard />} />
              <Route path="/patient/doctors"                element={<DoctorsPage />} />
              <Route path="/patient/doctors/:id"            element={<DoctorProfilePage />} />
              <Route path="/patient/book"                   element={<BookAppointmentPage />} />
              <Route path="/patient/appointments"           element={<AppointmentsPage />} />
              <Route path="/patient/appointments/:id"       element={<AppointmentDetail />} />
              <Route path="/patient/profile"                element={<PatientProfile />} />
            </Route>
          </Route>

          {/* ─── Doctor ─────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
            <Route element={<DoctorLayout />}>
              <Route path="/doctor/dashboard"               element={<DoctorDashboard />} />
              <Route path="/doctor/appointments"            element={<DoctorAppointments />} />
              <Route path="/doctor/appointments/:id"        element={<DoctorApptDetail />} />
              <Route path="/doctor/consultation/:id"        element={<ConsultationPage />} />
              <Route path="/doctor/profile"                 element={<DoctorProfile />} />
            </Route>
          </Route>

          {/* ─── Admin ──────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard"                element={<AdminDashboard />} />
              <Route path="/admin/users"                    element={<AdminUsers />} />
              <Route path="/admin/doctors"                  element={<AdminDoctors />} />
              <Route path="/admin/doctors/create"           element={<AdminDoctorCreate />} />
              <Route path="/admin/doctors/:id"              element={<AdminDoctorEdit />} />
              <Route path="/admin/appointments"             element={<AdminAppointments />} />
              <Route path="/admin/leave"                    element={<AdminLeave />} />
            </Route>
          </Route>

          {/* ─── Telehealth Virtual Consultation Room ───────────── */}
          <Route element={<ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'ADMIN']} />}>
            <Route path="/telehealth/:appointmentId" element={<TelehealthRoom />} />
          </Route>

          {/* ─── Fallback ───────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
