import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, Search, User, LogOut, Menu, X, Heart } from 'lucide-react';
import SidebarLayout from '../components/navigation/SidebarLayout';

const patientNavItems = [
  { to: '/patient/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patient/doctors',      icon: Search,          label: 'Find Doctors' },
  { to: '/patient/appointments', icon: Calendar,        label: 'Appointments' },
  { to: '/patient/profile',      icon: User,            label: 'Profile' },
];

const PatientLayout: React.FC = () => (
  <SidebarLayout
    navItems={patientNavItems}
    portalLabel="Patient Portal"
    accentColor="primary"
  />
);

export default PatientLayout;
