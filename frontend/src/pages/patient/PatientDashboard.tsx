import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, ArrowRight, Stethoscope, PlusCircle, CheckCircle, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { appointmentApi, patientApi } from '../../api';
import { useCurrentUser } from '../../store/authStore';
import StatusBadge from '../../components/ui/StatusBadge';
import { StatCardSkeleton, CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const PatientDashboard: React.FC = () => {
  const user = useCurrentUser();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['patient-stats'],
    queryFn: async () => (await patientApi.getStats()).data,
  });

  const { data: appointmentsPage, isLoading: apptsLoading } = useQuery({
    queryKey: ['patient-appointments', 'CONFIRMED'],
    queryFn: async () => (await appointmentApi.list({ status: 'CONFIRMED', size: 5 })).data,
  });

  const upcomingAppts = appointmentsPage?.content || [];
  const nextAppt = upcomingAppts[0];

  return (
    <div className="page space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Welcome back, {user?.name}</h1>
          <p className="page-subtitle">Here is an overview of your upcoming consultations and health records.</p>
        </div>
        <Link to="/patient/doctors" className="btn-primary gap-2 shadow-sm self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" />
          <span>Book Appointment</span>
        </Link>
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
              <div className="stat-value text-primary">{stats?.upcomingCount ?? 0}</div>
              <div className="stat-label">Upcoming Consultations</div>
            </div>
            <div className="stat-card border-l-4 border-l-accent">
              <div className="stat-value text-accent-600">{stats?.completedCount ?? 0}</div>
              <div className="stat-label">Completed Visits</div>
            </div>
            <div className="stat-card border-l-4 border-l-destructive">
              <div className="stat-value text-destructive">{stats?.cancelledCount ?? 0}</div>
              <div className="stat-label">Cancelled Appointments</div>
            </div>
          </>
        )}
      </div>

      {/* Next Appointment Card */}
      {nextAppt && (
        <div className="card bg-gradient-to-r from-primary-50/70 to-card border-primary/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-primary tracking-wide uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Next Scheduled Appointment</span>
            </div>
            <StatusBadge status={nextAppt.status} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-base flex-shrink-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Dr. {nextAppt.doctorName}</h3>
                <p className="text-xs text-muted-foreground">{nextAppt.doctorSpecialization}</p>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{nextAppt.appointmentDate}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Clock className="w-4 h-4 text-primary" />
                <span>{nextAppt.startTime} - {nextAppt.endTime}</span>
              </div>
            </div>

            <div className="sm:text-right">
              <Link to={`/patient/appointments/${nextAppt.id}`} className="btn-primary btn-sm gap-1.5">
                <span>View Details & Summary</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Daily Medication Tracker */}
      <div className="card space-y-4 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💊</span>
            <div>
              <h3 className="font-bold text-sm text-foreground">Today's Medication Schedule</h3>
              <p className="text-[11px] text-muted-foreground">Track daily prescribed doses and maintain adherence</p>
            </div>
          </div>
          <span className="badge badge-success text-[11px]">80% Adherence</span>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { time: 'Morning (08:00 AM)', name: 'Omeprazole 20mg', inst: 'Before breakfast', taken: true },
            { time: 'Afternoon (01:00 PM)', name: 'Amoxicillin 500mg', inst: 'After lunch with water', taken: true },
            { time: 'Night (09:00 PM)', name: 'Cetirizine 10mg', inst: 'Before bedtime', taken: false },
          ].map((med, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                med.taken ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' : 'bg-card border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary text-[10px] uppercase">{med.time}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${med.taken ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {med.taken ? '✓ Taken' : 'Pending'}
                </span>
              </div>
              <div className="font-bold text-foreground">{med.name}</div>
              <div className="text-muted-foreground text-[11px]">{med.inst}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Upcoming Consultations</h2>
          <Link to="/patient/appointments" className="text-xs text-primary font-semibold hover:underline">
            View All History →
          </Link>
        </div>

        {apptsLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : upcomingAppts.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No upcoming appointments"
              description="You have no consultations scheduled. Search doctors to book a new appointment."
              action={
                <Link to="/patient/doctors" className="btn-primary btn-sm mt-2">
                  Find Doctors
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingAppts.map((appt) => (
              <div key={appt.id} className="card space-y-3 hover:border-primary/40">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                      Dr
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Dr. {appt.doctorName}</div>
                      <div className="text-xs text-muted-foreground">{appt.doctorSpecialization}</div>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{appt.appointmentDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{appt.startTime}</span>
                  </div>
                </div>

                {appt.symptomsText && (
                  <p className="text-xs text-muted-foreground italic line-clamp-1">
                    Symptoms: "{appt.symptomsText}"
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <Link to={`/patient/appointments/${appt.id}`} className="btn-outline btn-sm text-xs">
                    View Details
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

export default PatientDashboard;
