import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Stethoscope, User, Eye } from 'lucide-react';
import { adminApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import type { AppointmentStatus, Appointment } from '../../types';

const AdminAppointments: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-appointments-list', statusFilter],
    queryFn: async () =>
      (
        await adminApi.listAppointments({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          size: 50,
        })
      ).data,
  });

  const appointments: Appointment[] = pageData?.content || [];

  return (
    <div className="page space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">All Clinic Appointments</h1>
        <p className="page-subtitle">Master schedule of all patient consultations across all physicians.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1 text-sm font-medium">
        {(['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'HELD'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 rounded-t-md transition-all whitespace-nowrap ${
              statusFilter === tab
                ? 'border-b-2 border-primary text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="table-wrapper border-0">
            <table className="table">
              <tbody>
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
              </tbody>
            </table>
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No appointments found"
            description="No consultations recorded matching this filter."
          />
        ) : (
          <div className="table-wrapper border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Calendar Sync</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>
                      <div className="font-semibold text-foreground">{appt.patientName}</div>
                      <div className="text-xs text-muted-foreground">{appt.patientEmail}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-foreground">Dr. {appt.doctorName}</div>
                      <div className="text-xs text-muted-foreground">{appt.doctorSpecialization}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{appt.appointmentDate}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {appt.startTime} - {appt.endTime}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={appt.status} />
                    </td>
                    <td>
                      <span className={`badge ${appt.calendarSynced ? 'badge-success' : 'badge-muted'}`}>
                        {appt.calendarSynced ? 'Synced' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAppointments;
