import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { doctorApi, adminApi } from '../../api';
import { useToast } from '../../components/ui/Toaster';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

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
    }
  }, [doctor, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values: DoctorEditForm) => {
      return (await adminApi.updateDoctor(Number(id), values)).data;
    },
    onSuccess: () => {
      toastSuccess('Doctor Updated', 'Doctor configuration saved successfully.');
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
    <div className="page max-w-2xl space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Doctors</span>
        </button>
      </div>

      <div className="card space-y-6">
        <div className="pb-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Edit Doctor Profile</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Modify credentials, specialization, or active availability.
          </p>
        </div>

        <form onSubmit={handleSubmit((values) => updateMutation.mutate(values))} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Full Name</label>
              <input {...register('name')} className="input" />
            </div>

            <div className="field">
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Specialization</label>
              <input {...register('specialization')} className="input" />
            </div>

            <div className="field">
              <label className="label">Slot Duration (Minutes)</label>
              <select {...register('slotDurationMinutes')} className="input cursor-pointer">
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
              <label className="label">Qualifications</label>
              <input {...register('qualifications')} className="input" />
            </div>

            <div className="field">
              <label className="label">Experience (Years)</label>
              <input {...register('experienceYears')} type="number" min={0} className="input" />
            </div>
          </div>

          <div className="field">
            <label className="label">Bio</label>
            <textarea {...register('bio')} rows={3} className="input resize-none" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="activeCheck" {...register('active')} className="rounded" />
            <label htmlFor="activeCheck" className="text-sm font-medium cursor-pointer">
              Active (Accepting new bookings)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/admin/doctors')}
              className="btn-outline"
            >
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDoctorEdit;
