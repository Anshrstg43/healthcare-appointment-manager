import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Stethoscope, Eye, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { appointmentApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toaster';
import type { AppointmentStatus } from '../../types';

const AppointmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'ALL'>('ALL');
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['patient-appointments-list', activeTab],
    queryFn: async () =>
      (
        await appointmentApi.list({
          status: activeTab === 'ALL' ? undefined : activeTab,
          size: 30,
        })
      ).data,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await appointmentApi.cancel(id);
    },
    onSuccess: () => {
      toastSuccess('Appointment Cancelled', 'Your appointment has been cancelled.');
      queryClient.invalidateQueries({ queryKey: ['patient-appointments-list'] });
      queryClient.invalidateQueries({ queryKey: ['patient-stats'] });
    },
    onError: (err: any) => {
      toastError('Cancellation Failed', err.response?.data?.message || 'Failed to cancel');
    },
  });

  const appointments = pageData?.content || [];

  return (
    <div className="page space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-subtitle">Track, reschedule, or review all your scheduled and completed consultations.</p>
        </div>
        <Link to="/patient/doctors" className="btn-primary btn-sm self-start sm:self-auto">
          Book New Consultation
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1 text-sm font-medium">
        {(['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-md transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'ALL' ? 'All Appointments' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table / List */}
      {isLoading ? (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <tbody>
                <TableRowSkeleton cols={5} />
                <TableRowSkeleton cols={5} />
                <TableRowSkeleton cols={5} />
              </tbody>
            </table>
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No appointments found"
            description={
              activeTab === 'ALL'
                ? "You haven't booked any appointments yet."
                : `No appointments with status "${activeTab.toLowerCase()}".`
            }
            action={
              <Link to="/patient/doctors" className="btn-primary btn-sm mt-2">
                Find Doctors
              </Link>
            }
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor & Specialization</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Reason / Symptoms</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>
                      <div className="font-semibold text-foreground">Dr. {appt.doctorName}</div>
                      <div className="text-xs text-muted-foreground">{appt.doctorSpecialization}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{appt.appointmentDate}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {appt.startTime} - {appt.endTime}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="max-w-xs truncate text-xs text-muted-foreground">
                      {appt.symptomsText || <span className="italic text-muted-foreground/50">None specified</span>}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/patient/appointments/${appt.id}`}
                          className="btn-outline btn-sm text-xs py-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                        {appt.status === 'CONFIRMED' && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this appointment?')) {
                                cancelMutation.mutate(appt.id);
                              }
                            }}
                            className="btn-danger btn-sm text-xs py-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
