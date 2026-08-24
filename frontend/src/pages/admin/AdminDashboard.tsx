import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Stethoscope, Calendar, CalendarOff, PlusCircle, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { adminApi } from '../../api';
import { StatCardSkeleton } from '../../components/ui/Skeleton';

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await adminApi.getStats()).data,
  });

  return (
    <div className="page space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Clinic Administration</h1>
          <p className="page-subtitle">Hospital operations, doctor rosters, appointments, and leave schedules.</p>
        </div>
        <Link to="/admin/doctors/create" className="btn-primary btn-sm gap-2 self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" />
          <span>Add New Doctor</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="stat-card border-l-4 border-l-primary">
              <div className="stat-value text-primary">{stats?.totalPatients ?? 0}</div>
              <div className="stat-label flex items-center gap-1.5 mt-1">
                <Users className="w-4 h-4 text-primary" /> Registered Patients
              </div>
            </div>

            <div className="stat-card border-l-4 border-l-accent">
              <div className="stat-value text-accent-600">{stats?.totalDoctors ?? 0}</div>
              <div className="stat-label flex items-center gap-1.5 mt-1">
                <Stethoscope className="w-4 h-4 text-accent" /> Active Doctors
              </div>
            </div>

            <div className="stat-card border-l-4 border-l-primary-500">
              <div className="stat-value text-primary-600">{stats?.todayAppointments ?? 0}</div>
              <div className="stat-label flex items-center gap-1.5 mt-1">
                <Calendar className="w-4 h-4 text-primary" /> Today's Consultations
              </div>
            </div>

            <div className="stat-card border-l-4 border-l-green-500">
              <div className="stat-value text-green-600">{stats?.upcomingAppointments ?? 0}</div>
              <div className="stat-label flex items-center gap-1.5 mt-1">
                <Activity className="w-4 h-4 text-green-600" /> Upcoming Active Bookings
              </div>
            </div>

            <div className="stat-card border-l-4 border-l-destructive">
              <div className="stat-value text-destructive">{stats?.cancelledAppointments ?? 0}</div>
              <div className="stat-label flex items-center gap-1.5 mt-1">
                <CalendarOff className="w-4 h-4 text-destructive" /> Cancelled Appointments
              </div>
            </div>

            <div className="stat-card border-l-4 border-l-amber-500">
              <div className="stat-value text-amber-600">{stats?.doctorsOnLeave ?? 0}</div>
              <div className="stat-label flex items-center gap-1.5 mt-1">
                <CalendarOff className="w-4 h-4 text-amber-500" /> Doctors on Leave Today
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid sm:grid-cols-3 gap-4 pt-4">
        <Link to="/admin/doctors" className="card p-5 hover:border-primary/50 transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Manage Doctors</h3>
              <p className="text-xs text-muted-foreground">Configure profiles & slot durations</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            View Doctors <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link to="/admin/leave" className="card p-5 hover:border-primary/50 transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <CalendarOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Doctor Leave & Schedule</h3>
              <p className="text-xs text-muted-foreground">Set leave & auto-notify patients</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            Manage Leave <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link to="/admin/appointments" className="card p-5 hover:border-primary/50 transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">All Appointments</h3>
              <p className="text-xs text-muted-foreground">Global appointment schedule</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            View Schedule <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
