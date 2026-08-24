import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Stethoscope, User, ArrowRight, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { doctorPortalApi } from '../../api';
import { useCurrentUser } from '../../store/authStore';
import StatusBadge from '../../components/ui/StatusBadge';
import { StatCardSkeleton, CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const DoctorDashboard: React.FC = () => {
  const user = useCurrentUser();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['doctor-stats'],
    queryFn: async () => (await doctorPortalApi.getStats()).data,
  });

  const { data: todayAppts, isLoading: todayLoading } = useQuery({
    queryKey: ['doctor-today-appts'],
    queryFn: async () => (await doctorPortalApi.getAppointments({ status: 'CONFIRMED', size: 10 })).data,
  });

  const appointments = todayAppts?.content || [];

  return (
    <div className="page space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Doctor Dashboard</h1>
        <p className="page-subtitle">Welcome back, Dr. {user?.name}. Here is your clinical schedule.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="stat-card border-l-4 border-l-primary">
              <div className="stat-value text-primary">{stats?.todayCount ?? 0}</div>
              <div className="stat-label">Appointments Today</div>
            </div>
            <div className="stat-card border-l-4 border-l-accent">
              <div className="stat-value text-accent-600">{stats?.upcomingCount ?? 0}</div>
              <div className="stat-label">Total Upcoming</div>
            </div>
            <div className="stat-card border-l-4 border-l-success">
              <div className="stat-value text-success">{stats?.completedCount ?? 0}</div>
              <div className="stat-label">Completed Consultations</div>
            </div>
          </>
        )}
      </div>

      {/* Upcoming / Today's Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Active Consultations Queue</h2>
          <Link to="/doctor/appointments" className="text-xs text-primary font-semibold hover:underline">
            View All →
          </Link>
        </div>

        {todayLoading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : appointments.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No consultations in queue"
              description="You have no active appointments scheduled for today."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:border-primary/50 transition-all"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{appt.patientName}</h3>
                      <StatusBadge status={appt.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> {appt.appointmentDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" /> {appt.startTime} - {appt.endTime}
                      </span>
                    </div>

                    {appt.symptomsText && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
                        Symptoms: "{appt.symptomsText}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Link
                    to={`/doctor/consultation/${appt.id}`}
                    className="btn-primary btn-sm gap-1.5 shadow-sm"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Open Consultation</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
