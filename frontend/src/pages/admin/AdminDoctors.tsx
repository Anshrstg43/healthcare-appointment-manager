import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Stethoscope, PlusCircle, Edit2, CalendarOff, Clock, Award } from 'lucide-react';
import { adminApi } from '../../api';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const AdminDoctors: React.FC = () => {
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-doctors-list'],
    queryFn: async () => (await adminApi.listDoctors({ size: 50 })).data,
  });

  const doctors = pageData?.content || [];

  return (
    <div className="page space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Doctor Management</h1>
          <p className="page-subtitle">Configure doctor specializations, slot durations, and practice availability.</p>
        </div>
        <Link to="/admin/doctors/create" className="btn-primary btn-sm gap-2 self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" />
          <span>Add New Doctor</span>
        </Link>
      </div>

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
        ) : doctors.length === 0 ? (
          <EmptyState
            title="No doctors configured"
            description="Create your first physician profile to start accepting appointments."
            action={
              <Link to="/admin/doctors/create" className="btn-primary btn-sm mt-2">
                Add Doctor
              </Link>
            }
          />
        ) : (
          <div className="table-wrapper border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Experience & Qualifications</th>
                  <th>Slot Duration</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="font-semibold text-foreground">Dr. {d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.email}</div>
                    </td>
                    <td>
                      <span className="badge-primary">{d.specialization}</span>
                    </td>
                    <td>
                      <div className="text-xs font-medium text-foreground">
                        {d.experienceYears || 0} Years Experience
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                        {d.qualifications || '—'}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{d.slotDurationMinutes} mins</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${d.active ? 'badge-success' : 'badge-muted'}`}>
                        {d.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/doctors/${d.id}`}
                          className="btn-outline btn-sm text-xs py-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                        <Link
                          to={`/admin/leave?doctorId=${d.id}`}
                          className="btn-outline btn-sm text-xs py-1 text-amber-700 hover:bg-amber-50"
                        >
                          <CalendarOff className="w-3.5 h-3.5" />
                          <span>Leave</span>
                        </Link>
                      </div>
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

export default AdminDoctors;
