import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, User, Eye, Stethoscope } from 'lucide-react';
import { doctorPortalApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import type { AppointmentStatus } from '../../types';

const DoctorAppointments: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['doctor-appointments-list', statusFilter],
    queryFn: async () =>
      (
        await doctorPortalApi.getAppointments({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          size: 30,
        })
      ).data,
  });

  const appointments = pageData?.content || [];

  return (
    <div className="page space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Patient Appointments</h1>
        <p className="page-subtitle">View your full consultation roster, clinical notes, and patient records.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1 text-sm font-medium">
        {(['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
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
      {isLoading ? (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <tbody>
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
            description="No consultations matched your selected filter."
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Symptoms Intake</th>
                  <th className="text-right">Actions</th>
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
                      {appt.symptomsText || <span className="italic text-muted-foreground/50">None</span>}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/doctor/consultation/${appt.id}`}
                          className="btn-primary btn-sm text-xs py-1"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Consultation</span>
                        </Link>
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

export default DoctorAppointments;
