import React from 'react';
import { LayoutDashboard, Calendar, User, Clock } from 'lucide-react';
import SidebarLayout from '../components/navigation/SidebarLayout';

const doctorNavItems = [
  { to: '/doctor/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctor/appointments', icon: Calendar,        label: 'Appointments' },
  { to: '/doctor/profile',      icon: User,            label: 'Profile' },
];

const DoctorLayout: React.FC = () => (
  <SidebarLayout
    navItems={doctorNavItems}
    portalLabel="Doctor Portal"
    accentColor="accent"
  />
);

export default DoctorLayout;
