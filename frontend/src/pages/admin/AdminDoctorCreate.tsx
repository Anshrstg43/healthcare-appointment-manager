import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Stethoscope, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../api';
import { useToast } from '../../components/ui/Toaster';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DoctorCreateForm {
  name: string;
  email: string;
  password: string;
  phone?: string;
  specialization: string;
  qualifications?: string;
  experienceYears: number;
  slotDurationMinutes: number;
  bio?: string;
}

const AdminDoctorCreate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DoctorCreateForm>({
    defaultValues: {
      slotDurationMinutes: 30,
      experienceYears: 5,
    },
  });

  const onSubmit = async (values: DoctorCreateForm) => {
    if (!values.name || !values.email || !values.password || !values.specialization) {
      toastError('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await adminApi.createDoctor({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        specialization: values.specialization,
        qualifications: values.qualifications,
        experienceYears: Number(values.experienceYears) || 0,
        slotDurationMinutes: Number(values.slotDurationMinutes) || 30,
        bio: values.bio,
      });
      toastSuccess('Doctor Created', `Dr. ${values.name} profile has been registered.`);
      navigate('/admin/doctors');
    } catch (err: any) {
      toastError('Creation Failed', err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-xl font-bold text-foreground">Create Doctor Profile</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register a physician account, assign medical specialization, and configure consultation slot intervals.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Full Name *</label>
              <input
                {...register('name', { required: 'Name is required' })}
                placeholder="Dr. Gregory House"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Email (Login ID) *</label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                placeholder="dr.house@healthcare.com"
                className="input"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Temporary Password *</label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                placeholder="••••••••"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Phone</label>
              <input {...register('phone')} placeholder="+1 (555) 000-0000" className="input" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Specialization *</label>
              <input
                {...register('specialization', { required: 'Specialization is required' })}
                placeholder="e.g. Cardiology, Dermatology"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Slot Duration (Minutes)</label>
              <select {...register('slotDurationMinutes')} className="input cursor-pointer">
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes (Standard)</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Qualifications</label>
              <input
                {...register('qualifications')}
                placeholder="e.g. MD, FACC - Harvard"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Experience (Years)</label>
              <input
                {...register('experienceYears')}
                type="number"
                min={0}
                className="input"
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Professional Bio</label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Summary of clinical background, areas of expertise..."
              className="input resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/admin/doctors')}
              className="btn-outline"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <LoadingSpinner size="sm" className="text-white" /> : 'Create Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDoctorCreate;
