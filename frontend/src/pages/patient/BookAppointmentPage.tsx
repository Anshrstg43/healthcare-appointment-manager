import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { doctorApi, appointmentApi } from '../../api';
import { useToast } from '../../components/ui/Toaster';
import type { TimeSlot, Doctor } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const BookAppointmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDoctorId = searchParams.get('doctorId');
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();

  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(
    initialDoctorId ? Number(initialDoctorId) : null
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [symptomsText, setSymptomsText] = useState('');
  const [step, setStep] = useState<number>(1);

  // Fetch list of doctors
  const { data: doctorsPage } = useQuery({
    queryKey: ['doctors-booking-list'],
    queryFn: async () => (await doctorApi.search({ size: 50 })).data,
  });
  const doctors = doctorsPage?.content || [];

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Fetch available slots for selected doctor + date
  const {
    data: availableSlots,
    isLoading: slotsLoading,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: ['doctor-slots', selectedDoctorId, selectedDate],
    queryFn: async () => {
      if (!selectedDoctorId || !selectedDate) return [];
      const res = await doctorApi.getAvailability(selectedDoctorId, selectedDate);
      return res.data;
    },
    enabled: !!selectedDoctorId && !!selectedDate,
  });

  // Reset selected slot when doctor or date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDoctorId, selectedDate]);

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDoctorId || !selectedDate || !selectedSlot) {
        throw new Error('Please select a doctor, date, and time slot');
      }
      return (
        await appointmentApi.create({
          doctorId: selectedDoctorId,
          appointmentDate: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          symptomsText: symptomsText.trim() || undefined,
        })
      ).data;
    },
    onSuccess: (data) => {
      toastSuccess(
        'Appointment Confirmed!',
        `Your consultation with Dr. ${data.doctorName} on ${data.appointmentDate} at ${data.startTime} is booked.`
      );
      navigate(`/patient/appointments/${data.id}`);
    },
    onError: (err: any) => {
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        'Failed to confirm appointment. Please try again.';

      if (status === 409) {
        toastError(
          'Slot Unavailable',
          'This slot was just booked by another patient or the doctor is on leave. Please select a different time.'
        );
        refetchSlots();
        setStep(2);
      } else {
        toastError('Booking Error', message);
      }
    },
  });

  return (
    <div className="page max-w-3xl space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Schedule an Appointment</h1>
        <p className="page-subtitle">
          Follow the steps below to reserve your slot and provide pre-visit symptom intake.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 text-xs font-semibold">
        <div
          className={`flex items-center gap-2 ${
            step >= 1 ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step >= 1 ? 'bg-primary text-white' : 'bg-muted'
            }`}
          >
            1
          </span>
          <span>Doctor & Date</span>
        </div>

        <div className="w-12 h-px bg-border hidden sm:block" />

        <div
          className={`flex items-center gap-2 ${
            step >= 2 ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step >= 2 ? 'bg-primary text-white' : 'bg-muted'
            }`}
          >
            2
          </span>
          <span>Select Time Slot</span>
        </div>

        <div className="w-12 h-px bg-border hidden sm:block" />

        <div
          className={`flex items-center gap-2 ${
            step >= 3 ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step >= 3 ? 'bg-primary text-white' : 'bg-muted'
            }`}
          >
            3
          </span>
          <span>Symptoms & Review</span>
        </div>
      </div>

      {/* Step 1: Doctor & Date */}
      {step === 1 && (
        <div className="card space-y-6 animate-slide-up">
          <div className="space-y-4">
            <div className="field">
              <label className="label">1. Choose Doctor</label>
              <select
                value={selectedDoctorId || ''}
                onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                className="input cursor-pointer"
              >
                <option value="">-- Select a Specialist --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name} ({d.specialization}) - {d.slotDurationMinutes} min
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label">2. Select Consultation Date</label>
              <input
                type="date"
                value={selectedDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={() => {
                if (!selectedDoctorId) {
                  toastError('Please select a doctor', '');
                  return;
                }
                setStep(2);
              }}
              disabled={!selectedDoctorId || !selectedDate}
              className="btn-primary gap-2"
            >
              <span>Next: View Available Slots</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Time Slots */}
      {step === 2 && (
        <div className="card space-y-6 animate-slide-up">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Available Slots with Dr. {selectedDoctor?.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Date: <span className="font-semibold text-foreground">{selectedDate}</span>
            </p>
          </div>

          {slotsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <LoadingSpinner size="md" />
              <p className="text-xs text-muted-foreground">Calculating real-time availability...</p>
            </div>
          ) : !availableSlots || availableSlots.length === 0 ? (
            <div className="p-6 bg-muted/40 rounded-lg text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-warning mx-auto" />
              <p className="text-sm font-semibold">No slots available on this date</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                The doctor may be on leave or fully booked. Please choose a different date.
              </p>
              <button
                onClick={() => setStep(1)}
                className="btn-outline btn-sm mt-3"
              >
                Change Date
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {availableSlots.map((slot, index) => {
                  const isSelected =
                    selectedSlot?.startTime === slot.startTime;
                  const isAvail = slot.available;

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={!isAvail}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-lg border text-center transition-all text-xs font-semibold ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                          : isAvail
                          ? 'border-border bg-card hover:border-primary/60 hover:bg-primary-50/40 text-foreground cursor-pointer'
                          : 'border-border/60 bg-muted/50 text-muted-foreground/50 cursor-not-allowed line-through'
                      }`}
                    >
                      <div>{slot.startTime}</div>
                      <div className="text-[10px] font-normal opacity-80">
                        {isAvail ? 'Available' : slot.reason || 'Booked'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button onClick={() => setStep(1)} className="btn-outline gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedSlot}
              className="btn-primary gap-2"
            >
              <span>Next: Symptom Intake</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Symptoms & Final Review */}
      {step === 3 && (
        <div className="card space-y-6 animate-slide-up">
          {/* Summary Box */}
          <div className="bg-primary-50/60 p-4 rounded-lg border border-primary-200 space-y-2">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wide">
              Appointment Summary
            </h4>
            <div className="grid sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block">Doctor</span>
                <span className="font-semibold text-foreground">
                  Dr. {selectedDoctor?.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Specialization</span>
                <span className="font-semibold text-foreground">
                  {selectedDoctor?.specialization}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Date & Time</span>
                <span className="font-semibold text-foreground">
                  {selectedDate} at {selectedSlot?.startTime}
                </span>
              </div>
            </div>
          </div>

          {/* Symptoms Input */}
          <div className="space-y-2">
            <label className="label flex items-center justify-between">
              <span>Reason for Visit / Symptoms</span>
              <span className="text-xs text-primary font-normal flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Pre-visit Triage Enabled
              </span>
            </label>
            <textarea
              rows={4}
              value={symptomsText}
              onChange={(e) => setSymptomsText(e.target.value)}
              placeholder="Please describe any symptoms, how long you've had them, and any questions you have for the doctor..."
              className="input resize-none"
            />

            {/* Live Emergency Red-Flag Warning Banner */}
            {/chest pain|shortness of breath|difficulty breathing|stroke|loss of consciousness|anaphylaxis|severe bleeding/i.test(symptomsText) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-800 animate-slide-up">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold">⚠️ Urgent Medical Safety Alert</div>
                  <div>
                    You have entered symptoms that may indicate a medical emergency. If you are experiencing acute chest pain, severe shortness of breath, or neurological changes, please call <strong>911 / emergency services</strong> or visit the nearest emergency room immediately.
                  </div>
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Our secure AI administrative assistant will summarize these symptoms to help your doctor prepare for your consultation.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button onClick={() => setStep(2)} className="btn-outline gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => bookingMutation.mutate()}
              disabled={bookingMutation.isPending}
              className="btn-primary btn-lg shadow-md gap-2"
            >
              {bookingMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="text-white" />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirm Appointment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointmentPage;
