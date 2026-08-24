import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { doctorApi, adminApi } from '../../api';
import { useToast } from '../../components/ui/Toaster';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { WorkingSchedule } from '../../types';

interface DoctorEditForm {
  name: string;
  phone?: string;
  specialization: string;
  qualifications?: string;
  experienceYears: number;
  slotDurationMinutes: number;
  bio?: string;
  active: boolean;
}

const AdminDoctorEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [schedule, setSchedule] = useState({
    monday: { active: true, start: '09:00', end: '17:00' },
    tuesday: { active: true, start: '09:00', end: '17:00' },
    wednesday: { active: true, start: '09:00', end: '17:00' },
    thursday: { active: true, start: '09:00', end: '17:00' },
    friday: { active: true, start: '09:00', end: '17:00' },
    saturday: { active: false, start: '09:00', end: '13:00' },
    sunday: { active: false, start: '09:00', end: '13:00' },
  });

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['admin-doctor-detail', id],
    queryFn: async () => (await doctorApi.getById(Number(id))).data,
    enabled: !!id,
  });

  const { register, handleSubmit, reset } = useForm<DoctorEditForm>();

  useEffect(() => {
    if (doctor) {
      reset({
        name: doctor.name,
        phone: doctor.phone || '',
        specialization: doctor.specialization,
        qualifications: doctor.qualifications || '',
        experienceYears: doctor.experienceYears || 0,
        slotDurationMinutes: doctor.slotDurationMinutes || 30,
        bio: doctor.bio || '',
        active: doctor.active,
      });

      if (doctor.workingSchedule) {
        try {
          const parsed = typeof doctor.workingSchedule === 'string'
            ? JSON.parse(doctor.workingSchedule)
            : doctor.workingSchedule;

          setSchedule((prev) => ({
            ...prev,
            monday: parsed.monday ? { active: true, ...parsed.monday } : { ...prev.monday, active: false },
            tuesday: parsed.tuesday ? { active: true, ...parsed.tuesday } : { ...prev.tuesday, active: false },
            wednesday: parsed.wednesday ? { active: true, ...parsed.wednesday } : { ...prev.wednesday, active: false },
            thursday: parsed.thursday ? { active: true, ...parsed.thursday } : { ...prev.thursday, active: false },
            friday: parsed.friday ? { active: true, ...parsed.friday } : { ...prev.friday, active: false },
            saturday: parsed.saturday ? { active: true, ...parsed.saturday } : { ...prev.saturday, active: false },
            sunday: parsed.sunday ? { active: true, ...parsed.sunday } : { ...prev.sunday, active: false },
          }));
        } catch (e) {
          // Keep defaults
        }
      }
    }
  }, [doctor, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values: DoctorEditForm) => {
      const formattedSchedule: WorkingSchedule = {};
      (Object.keys(schedule) as Array<keyof typeof schedule>).forEach((day) => {
        if (schedule[day].active) {
          formattedSchedule[day] = { start: schedule[day].start, end: schedule[day].end };
        }
      });

      const payload = {
        ...values,
        workingSchedule: formattedSchedule,
      };

      return (await adminApi.updateDoctor(Number(id), payload)).data;
    },
    onSuccess: () => {
      toastSuccess('Doctor Updated', 'Doctor configuration and working hours saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-doctors-list'] });
      navigate('/admin/doctors');
    },
    onError: (err: any) => {
      toastError('Update Failed', err.response?.data?.message || 'Failed to update');
    },
  });

  if (isLoading) {
    return (
      <div className="page flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page max-w-3xl space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Doctors</span>
        </button>
      </div>

      <div className="card space-y-6">
        <div className="pb-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Edit Doctor Profile & Schedule</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Modify credentials, specialization, slot durations, and working hours roster.
          </p>
        </div>

        <form onSubmit={handleSubmit((values) => updateMutation.mutate(values))} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label text-xs">Full Name</label>
              <input {...register('name')} className="input text-xs" />
            </div>

            <div className="field">
              <label className="label text-xs">Phone</label>
              <input {...register('phone')} className="input text-xs" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label text-xs">Specialization</label>
              <input {...register('specialization')} className="input text-xs" />
            </div>

            <div className="field">
              <label className="label text-xs">Slot Duration</label>
              <select {...register('slotDurationMinutes')} className="input text-xs cursor-pointer">
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label text-xs">Qualifications</label>
              <input {...register('qualifications')} className="input text-xs" />
            </div>

            <div className="field">
              <label className="label text-xs">Experience (Years)</label>
              <input {...register('experienceYears')} type="number" min={0} className="input text-xs" />
            </div>
          </div>

          <div className="field">
            <label className="label text-xs">Bio & Clinical Summary</label>
            <textarea {...register('bio')} rows={2} className="input text-xs resize-none" />
          </div>

          {/* Working Hours Weekly Roster */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>Weekly Working Schedule & Hours</span>
            </div>

            <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border/60">
              {(Object.keys(schedule) as Array<keyof typeof schedule>).map((day) => (
                <div key={day} className="flex items-center justify-between gap-4 text-xs py-1 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2 w-28 capitalize">
                    <input
                      type="checkbox"
                      id={`day-${day}`}
                      checked={schedule[day].active}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], active: e.target.checked },
                        }))
                      }
                      className="rounded text-primary cursor-pointer"
                    />
                    <label htmlFor={`day-${day}`} className="font-medium cursor-pointer">
                      {day}
                    </label>
                  </div>

                  {schedule[day].active ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={schedule[day].start}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], start: e.target.value },
                          }))
                        }
                        className="px-2 py-1 bg-card border border-border rounded text-xs"
                      />
                      <span className="text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={schedule[day].end}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], end: e.target.value },
                          }))
                        }
                        className="px-2 py-1 bg-card border border-border rounded text-xs"
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-[11px]">Off Duty</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="activeCheck" {...register('active')} className="rounded" />
            <label htmlFor="activeCheck" className="text-xs font-semibold cursor-pointer">
              Active Doctor Account (Accepting incoming patient bookings)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/admin/doctors')}
              className="btn-outline btn-sm text-xs"
            >
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary btn-sm text-xs">
              {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDoctorEdit;
