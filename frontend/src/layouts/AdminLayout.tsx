import React from 'react';
import { LayoutDashboard, Users, Stethoscope, Calendar, CalendarOff } from 'lucide-react';
import SidebarLayout from '../components/navigation/SidebarLayout';

const adminNavItems = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',        icon: Users,           label: 'Users' },
  { to: '/admin/doctors',      icon: Stethoscope,     label: 'Doctors' },
  { to: '/admin/appointments', icon: Calendar,        label: 'Appointments' },
  { to: '/admin/leave',        icon: CalendarOff,     label: 'Doctor Leave' },
];

const AdminLayout: React.FC = () => (
  <SidebarLayout
    navItems={adminNavItems}
    portalLabel="Admin Portal"
    accentColor="warning"
  />
);

export default AdminLayout;
