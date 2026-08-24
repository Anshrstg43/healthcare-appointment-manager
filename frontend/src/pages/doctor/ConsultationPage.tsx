import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope,
  Sparkles,
  FileText,
  Pill,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  HelpCircle,
  Clock,
  Calendar,
  User,
} from 'lucide-react';
import { doctorPortalApi, appointmentApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useToast } from '../../components/ui/Toaster';
import type { PrescriptionItem } from '../../types';

const ConsultationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState<
    Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>
  >([]);
  const [followUpInstructions, setFollowUpInstructions] = useState('');

  // Fetch appointment data
  const { data: appt, isLoading } = useQuery({
    queryKey: ['doctor-consultation-appt', id],
    queryFn: async () => (await appointmentApi.getById(Number(id))).data,
    enabled: !!id,
  });

  // Sync existing notes & prescription into state
  useEffect(() => {
    if (appt) {
      if (appt.clinicalNotes) setClinicalNotes(appt.clinicalNotes);
      if (appt.prescription) {
        if (appt.prescription.items) {
          setPrescriptionItems(
            appt.prescription.items.map((item) => ({
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions || '',
            }))
          );
        }
        if (appt.prescription.followUpInstructions) {
          setFollowUpInstructions(appt.prescription.followUpInstructions);
        }
      }
    }
  }, [appt]);

  // Save notes mutation
  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      await doctorPortalApi.addNotes(Number(id), clinicalNotes);
    },
    onSuccess: () => {
      toastSuccess('Notes Saved', 'Clinical consultation notes updated.');
    },
    onError: (err: any) => {
      toastError('Save Failed', err.response?.data?.message || 'Error saving notes');
    },
  });

  // Save prescription mutation
  const savePrescriptionMutation = useMutation({
    mutationFn: async () => {
      if (prescriptionItems.length === 0) {
        throw new Error('Please add at least one medication item');
      }
      return await doctorPortalApi.addPrescription(Number(id), {
        items: prescriptionItems,
        followUpInstructions,
      });
    },
    onSuccess: () => {
      toastSuccess('Prescription Saved', 'Prescription & automated reminders scheduled.');
      queryClient.invalidateQueries({ queryKey: ['doctor-consultation-appt', id] });
    },
    onError: (err: any) => {
      toastError('Save Failed', err.message || err.response?.data?.message || 'Error');
    },
  });

  // Complete consultation mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      // 1. Save notes if present
      if (clinicalNotes.trim()) {
        await doctorPortalApi.addNotes(Number(id), clinicalNotes);
      }
      // 2. Save prescription if items exist
      if (prescriptionItems.length > 0) {
        await doctorPortalApi.addPrescription(Number(id), {
          items: prescriptionItems,
          followUpInstructions,
        });
      }
      // 3. Mark completed
      return (await doctorPortalApi.complete(Number(id))).data;
    },
    onSuccess: () => {
      toastSuccess(
        'Consultation Completed!',
        'Post-visit AI summary generated and patient records updated.'
      );
      queryClient.invalidateQueries({ queryKey: ['doctor-consultation-appt', id] });
      navigate('/doctor/dashboard');
    },
    onError: (err: any) => {
      toastError('Completion Failed', err.response?.data?.message || 'Error');
    },
  });

  const addMedicationRow = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicineName: '',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
        instructions: 'Take after meals',
      },
    ]);
  };

  const removeMedicationRow = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const updateMedicationRow = (
    index: number,
    field: keyof (typeof prescriptionItems)[0],
    value: string
  ) => {
    const updated = [...prescriptionItems];
    updated[index][field] = value;
    setPrescriptionItems(updated);
  };

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
        <button onClick={() => navigate('/doctor/dashboard')} className="btn-outline btn-sm mt-4">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="page max-w-5xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm gap-1.5 self-start">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Schedule</span>
        </button>

        <div className="flex items-center gap-3">
          <StatusBadge status={appt.status} />
          {appt.status !== 'COMPLETED' && (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="btn-primary shadow-md gap-2"
            >
              {completeMutation.isPending ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Complete Consultation</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Banner */}
      <div className="card bg-card border-primary/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{appt.patientName}</h2>
              <div className="text-xs text-muted-foreground flex gap-4 mt-0.5">
                <span>{appt.patientEmail}</span>
                {appt.patientPhone && <span>{appt.patientPhone}</span>}
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 sm:text-right">
            <div className="flex sm:justify-end items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-foreground">{appt.appointmentDate}</span>
            </div>
            <div className="flex sm:justify-end items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                {appt.startTime} - {appt.endTime}
              </span>
            </div>
          </div>
        </div>

        {appt.symptomsText && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Patient-Reported Symptoms
            </span>
            <p className="text-xs text-foreground bg-muted/40 p-3 rounded-md italic">
              "{appt.symptomsText}"
            </p>
          </div>
        )}
      </div>

      {/* AI Pre-Visit Summary Card */}
      {appt.preVisitSummary && (
        <div className="card border-primary/30 bg-gradient-to-r from-primary-50/50 via-card to-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Sparkles className="w-4 h-4" />
              <span>AI Pre-Visit Intake Analysis</span>
            </div>
            {appt.preVisitSummary.urgency && (
              <span
                className={`badge ${
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
            <div className="text-xs">
              <span className="font-semibold text-muted-foreground">Chief Complaint: </span>
              <span className="font-medium text-foreground">
                {appt.preVisitSummary.chiefComplaint}
              </span>
            </div>
          )}

          {appt.preVisitSummary.suggestedQuestions &&
            appt.preVisitSummary.suggestedQuestions.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-primary/10">
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Suggested Questions to Ask Patient:
                </span>
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                  {appt.preVisitSummary.suggestedQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {/* Clinical Notes Editor */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <FileText className="w-4 h-4 text-primary" />
            <span>Clinical Consultation Notes</span>
          </div>
          <button
            onClick={() => saveNotesMutation.mutate()}
            disabled={saveNotesMutation.isPending || !clinicalNotes.trim()}
            className="btn-outline btn-sm text-xs"
          >
            {saveNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
          </button>
        </div>

        <textarea
          rows={5}
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          placeholder="Enter objective clinical examination findings, diagnosis, vitals, and treatment discussion..."
          className="input resize-none"
        />
      </div>

      {/* Prescription Builder */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Pill className="w-4 h-4 text-primary" />
            <span>Prescription & Medication Schedule</span>
          </div>
          <button
            type="button"
            onClick={addMedicationRow}
            className="btn-outline btn-sm gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medicine</span>
          </button>
        </div>

        {prescriptionItems.length === 0 ? (
          <div className="p-6 bg-muted/30 rounded-lg text-center text-xs text-muted-foreground">
            No medications prescribed yet. Click "+ Add Medicine" above to prescribe medications.
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptionItems.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-muted/30 rounded-lg border border-border space-y-2.5 animate-slide-up"
              >
                <div className="grid sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Amoxicillin)"
                      value={item.medicineName}
                      onChange={(e) => updateMedicationRow(index, 'medicineName', e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={item.dosage}
                      onChange={(e) => updateMedicationRow(index, 'dosage', e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={item.frequency}
                      onChange={(e) => updateMedicationRow(index, 'frequency', e.target.value)}
                      className="input text-xs cursor-pointer"
                    >
                      <option value="Once daily">Once daily (9:00 AM)</option>
                      <option value="Twice daily">Twice daily (9:00 AM, 9:00 PM)</option>
                      <option value="Thrice daily">Thrice daily (8:00 AM, 2:00 PM, 8:00 PM)</option>
                      <option value="Four times daily">Four times daily</option>
                      <option value="As needed">As needed (PRN)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 5 days)"
                      value={item.duration}
                      onChange={(e) => updateMedicationRow(index, 'duration', e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeMedicationRow(index)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Instructions (e.g. Take after food with water)"
                    value={item.instructions}
                    onChange={(e) => updateMedicationRow(index, 'instructions', e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>
            ))}

            <div className="field pt-2">
              <label className="label text-xs">General Follow-Up Instructions</label>
              <input
                type="text"
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
                placeholder="e.g. Return in 10 days if symptoms persist. Rest and maintain hydration."
                className="input text-xs"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => savePrescriptionMutation.mutate()}
                disabled={savePrescriptionMutation.isPending}
                className="btn-secondary btn-sm text-xs"
              >
                {savePrescriptionMutation.isPending ? 'Saving...' : 'Save Prescription'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Post-Visit AI Summary (if already completed) */}
      {appt.postVisitSummary && (
        <div className="card border-accent/40 bg-accent-50/20 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-accent-700">
            <Sparkles className="w-4 h-4" />
            <span>Generated Patient-Friendly Post-Visit Summary</span>
          </div>
          <div className="text-xs text-foreground leading-relaxed whitespace-pre-line p-3 bg-card rounded-md border border-border">
            {appt.postVisitSummary.summaryText}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationPage;
