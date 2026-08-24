import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarOff, Plus, Trash2, AlertTriangle, Stethoscope, CheckCircle2 } from 'lucide-react';
import { adminApi, doctorApi } from '../../api';
import { useToast } from '../../components/ui/Toaster';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AdminLeave: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDocId = searchParams.get('doctorId');
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(
    initialDocId ? Number(initialDocId) : null
  );
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Fetch doctors
  const { data: doctorsPage } = useQuery({
    queryKey: ['admin-leave-doctors-list'],
    queryFn: async () => (await doctorApi.search({ size: 50 })).data,
  });
  const doctors = doctorsPage?.content || [];

  // Fetch leave records for selected doctor
  const { data: leaves, isLoading: leavesLoading } = useQuery({
    queryKey: ['admin-doctor-leaves', selectedDoctorId],
    queryFn: async () => {
      if (!selectedDoctorId) return [];
      const res = await adminApi.getDoctorLeaves(selectedDoctorId);
      return res.data;
    },
    enabled: !!selectedDoctorId,
  });

  const addLeaveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDoctorId || !leaveDate) {
        throw new Error('Please select a doctor and date');
      }
      return (
        await adminApi.addLeave(selectedDoctorId, {
          leaveDate,
          reason: leaveReason || undefined,
        })
      ).data;
    },
    onSuccess: () => {
      toastSuccess(
        'Leave Scheduled',
        'Doctor leave has been saved. Any conflicting patient bookings have been cancelled and notified.'
      );
      setLeaveDate('');
      setLeaveReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-leaves', selectedDoctorId] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => {
      toastError('Failed to Schedule Leave', err.response?.data?.message || 'Error');
    },
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: async (leaveId: number) => {
      await adminApi.deleteLeave(leaveId);
    },
    onSuccess: () => {
      toastSuccess('Leave Removed', 'Doctor leave date removed.');
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-leaves', selectedDoctorId] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => {
      toastError('Delete Failed', err.response?.data?.message || 'Error');
    },
  });

  return (
    <div className="page max-w-4xl space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Doctor Leave Management</h1>
        <p className="page-subtitle">
          Configure physician leave days. The system automatically identifies affected patient appointments,
          cancels them, dispatches explanatory email notices, and blacks out the date from booking slots.
        </p>
      </div>

      {/* Leave Booking Form */}
      <div className="card space-y-4">
        <h2 className="text-base font-bold text-foreground">Schedule Leave Date</h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="field">
            <label className="label">Select Doctor</label>
            <select
              value={selectedDoctorId || ''}
              onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
              className="input cursor-pointer"
            >
              <option value="">-- Choose Doctor --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name} ({d.specialization})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Leave Date</label>
            <input
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              className="input"
            />
          </div>

          <div className="field">
            <label className="label">Reason / Notes</label>
            <input
              type="text"
              placeholder="e.g. Medical conference, Annual leave"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Automatic Cascade Warning:</strong> Submitting this leave will cancel all confirmed appointments
            for Dr. {doctors.find((d) => d.id === selectedDoctorId)?.name || 'this doctor'} on this date and
            automatically dispatch notification emails to affected patients.
          </span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => addLeaveMutation.mutate()}
            disabled={addLeaveMutation.isPending || !selectedDoctorId || !leaveDate}
            className="btn-primary gap-2"
          >
            {addLeaveMutation.isPending ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Schedule Leave & Notify</span>
          </button>
        </div>
      </div>

      {/* Existing Leaves List */}
      {selectedDoctorId && (
        <div className="card space-y-4">
          <h2 className="text-base font-bold text-foreground">
            Scheduled Leave Dates for Dr.{' '}
            {doctors.find((d) => d.id === selectedDoctorId)?.name}
          </h2>

          {leavesLoading ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : !leaves || leaves.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">
              No leave days currently scheduled for this doctor.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Leave Date</th>
                    <th>Reason</th>
                    <th>Recorded At</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td className="font-semibold text-foreground">{leave.leaveDate}</td>
                      <td className="text-xs text-muted-foreground">{leave.reason || 'Not specified'}</td>
                      <td className="text-xs text-muted-foreground">
                        {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => {
                            if (confirm('Delete this leave date?')) {
                              deleteLeaveMutation.mutate(leave.id);
                            }
                          }}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLeave;
