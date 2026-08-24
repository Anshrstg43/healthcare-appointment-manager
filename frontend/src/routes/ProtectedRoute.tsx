import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard for their role
    const dashboardMap: Record<Role, string> = {
      PATIENT: '/patient/dashboard',
      DOCTOR: '/doctor/dashboard',
      ADMIN: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user.role]} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
