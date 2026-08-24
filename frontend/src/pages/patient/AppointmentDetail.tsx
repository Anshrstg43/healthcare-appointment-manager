import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Stethoscope,
  Sparkles,
  FileText,
  Pill,
  CheckCircle2,
  CalendarCheck,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { appointmentApi, calendarApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useToast } from '../../components/ui/Toaster';

const AppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const { data: appt, isLoading } = useQuery({
    queryKey: ['appointment-detail', id],
    queryFn: async () => (await appointmentApi.getById(Number(id))).data,
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await appointmentApi.cancel(Number(id));
    },
    onSuccess: () => {
      toastSuccess('Appointment Cancelled', 'The appointment was cancelled.');
      queryClient.invalidateQueries({ queryKey: ['appointment-detail', id] });
    },
    onError: (err: any) => {
      toastError('Cancellation Failed', err.response?.data?.message || 'Error');
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      return (
        await appointmentApi.reschedule(Number(id), {
          appointmentDate: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
        })
      ).data;
    },
    onSuccess: () => {
      toastSuccess('Appointment Rescheduled', 'Your consultation has been rescheduled.');
      setRescheduleModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['appointment-detail', id] });
    },
    onError: (err: any) => {
      toastError('Reschedule Failed', err.response?.data?.message || 'Slot unavailable');
    },
  });

  const calendarSyncMutation = useMutation({
    mutationFn: async () => {
      await calendarApi.sync(Number(id));
    },
    onSuccess: () => {
      toastSuccess('Calendar Synced', 'Google Calendar event synchronized.');
      queryClient.invalidateQueries({ queryKey: ['appointment-detail', id] });
    },
    onError: () => {
      toastError('Calendar Sync Failed', 'Could not sync event to Google Calendar.');
    },
  });

  if (isLoading) {
    return (
      <div className="page flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="page text-center py-16">
        <h2 className="text-xl font-bold">Appointment Not Found</h2>
        <Link to="/patient/appointments" className="btn-outline btn-sm mt-4">
          Back to Appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="page max-w-4xl space-y-8 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm gap-1.5 text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          {appt.status === 'CONFIRMED' && (
            <>
              <button
                onClick={() => setRescheduleModalOpen(true)}
                className="btn-outline btn-sm text-xs"
              >
                Reschedule
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this appointment?')) {
                    cancelMutation.mutate();
                  }
                }}
                className="btn-danger btn-sm text-xs"
              >
                Cancel Appointment
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <div className="card border-primary/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">
                Consultation Details
              </div>
              <h1 className="text-xl font-bold text-foreground">Dr. {appt.doctorName}</h1>
              <p className="text-xs text-primary font-medium">{appt.doctorSpecialization}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={appt.status} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-3 bg-muted/40 rounded-lg space-y-1">
            <span className="text-xs text-muted-foreground block flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> Date
            </span>
            <span className="text-sm font-semibold text-foreground">{appt.appointmentDate}</span>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg space-y-1">
            <span className="text-xs text-muted-foreground block flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> Time
            </span>
            <span className="text-sm font-semibold text-foreground">
              {appt.startTime} - {appt.endTime}
            </span>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg space-y-1">
            <span className="text-xs text-muted-foreground block flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-primary" /> Google Calendar
            </span>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${appt.calendarSynced ? 'text-success' : 'text-muted-foreground'}`}>
                {appt.calendarSynced ? 'Synchronized' : 'Not Synced'}
              </span>
              <button
                onClick={() => calendarSyncMutation.mutate()}
                disabled={calendarSyncMutation.isPending}
                className="text-[11px] text-primary hover:underline"
              >
                Sync Now
              </button>
            </div>
          </div>
        </div>

        {appt.symptomsText && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Reported Symptoms
            </h4>
            <p className="text-xs text-foreground bg-muted/30 p-3 rounded-md leading-relaxed">
              {appt.symptomsText}
            </p>
          </div>
        )}
      </div>

      {/* AI Pre-Visit Summary Card */}
      {appt.preVisitSummary && (
        <div className="card border-primary/30 bg-gradient-to-br from-primary-50/40 via-card to-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Sparkles className="w-4 h-4" />
              <span>AI Pre-Visit Intake Summary</span>
            </div>
            {appt.preVisitSummary.urgency && (
              <span
                className={`badge text-xs ${
                  appt.preVisitSummary.urgency === 'HIGH'
                    ? 'badge-danger'
                    : appt.preVisitSummary.urgency === 'MEDIUM'
                    ? 'badge-warning'
                    : 'badge-success'
                }`}
              >
                Urgency: {appt.preVisitSummary.urgency}
              </span>
            )}
          </div>

          {appt.preVisitSummary.chiefComplaint && (
            <div>
              <span className="text-xs text-muted-foreground font-semibold">Chief Complaint:</span>
              <p className="text-xs text-foreground font-medium mt-0.5">
                {appt.preVisitSummary.chiefComplaint}
              </p>
            </div>
          )}

          {appt.preVisitSummary.suggestedQuestions && appt.preVisitSummary.suggestedQuestions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-primary/10">
              <span className="text-xs font-semibold text-primary-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Suggested Physician Questions:
              </span>
              <ul className="space-y-1 pl-4 list-disc text-xs text-muted-foreground">
                {appt.preVisitSummary.suggestedQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Post-Visit Section (Clinical notes + Post-visit AI summary + Prescriptions) */}
      {appt.status === 'COMPLETED' && (
        <div className="space-y-6">
          {/* Post Visit AI Summary */}
          {appt.postVisitSummary && (
            <div className="card border-accent/40 bg-accent-50/20 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-accent-700">
                <FileText className="w-4 h-4" />
                <span>Patient-Friendly Visit Summary</span>
              </div>
              <div className="text-xs text-foreground leading-relaxed whitespace-pre-line p-3 bg-card rounded-md border border-border">
                {appt.postVisitSummary.summaryText}
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {appt.prescription && (
            <div className="card space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Pill className="w-4 h-4 text-primary" />
                <span>Prescribed Medications</span>
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appt.prescription.items.map((item) => (
                      <tr key={item.id}>
                        <td className="font-semibold text-foreground">{item.medicineName}</td>
                        <td>{item.dosage}</td>
                        <td><span className="badge-primary">{item.frequency}</span></td>
                        <td>{item.duration}</td>
                        <td className="text-xs text-muted-foreground">{item.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {appt.prescription.followUpInstructions && (
                <div className="p-3 bg-muted/40 rounded-md text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground block mb-1">Follow-up Instructions:</span>
                  {appt.prescription.followUpInstructions}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-card max-w-md w-full space-y-4 animate-slide-up shadow-modal">
            <h3 className="text-base font-bold">Reschedule Appointment</h3>
            <p className="text-xs text-muted-foreground">
              Select a new date and time for consultation with Dr. {appt.doctorName}.
            </p>

            <div className="space-y-3">
              <div className="field">
                <label className="label">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="field">
                  <label className="label">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => rescheduleMutation.mutate()}
                disabled={rescheduleMutation.isPending || !newDate || !newStartTime || !newEndTime}
                className="btn-primary btn-sm"
              >
                {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetail;
