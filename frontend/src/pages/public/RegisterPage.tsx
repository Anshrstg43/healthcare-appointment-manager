import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Heart, Lock, Mail, User, Phone } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toaster';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface RegisterFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (values: RegisterFormValues) => {
    if (values.password !== values.confirmPassword) {
      toastError('Validation Error', "Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.register({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
      });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toastSuccess('Registration Successful!', 'Welcome to Healthcare Appointment Manager.');
      navigate('/patient/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toastError('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-700 mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Create your patient account</h2>
          <p className="text-xs text-muted-foreground">
            Schedule appointments, submit symptoms, and access digital prescriptions
          </p>
        </div>

        <div className="card shadow-modal">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="field">
              <label className="label">Full Name</label>
              <div className="relative">
                <input
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })}
                  type="text"
                  placeholder="Alex Morgan"
                  className={`input pl-9 ${errors.name ? 'input-error' : ''}`}
                />
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              </div>
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>

            <div className="field">
              <label className="label">Email address</label>
              <div className="relative">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                  })}
                  type="email"
                  placeholder="alex@example.com"
                  className={`input pl-9 ${errors.email ? 'input-error' : ''}`}
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              </div>
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            <div className="field">
              <label className="label">Phone number</label>
              <div className="relative">
                <input
                  {...register('phone', { required: 'Phone number is required', minLength: { value: 6, message: 'Minimum 6 digits' } })}
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className={`input pl-9 ${errors.phone ? 'input-error' : ''}`}
                />
                <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              </div>
              {errors.phone && <p className="field-error">{errors.phone.message}</p>}
            </div>

            <div className="field">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                  type="password"
                  placeholder="••••••••"
                  className={`input pl-9 ${errors.password ? 'input-error' : ''}`}
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>

            <div className="field">
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) => val === password || "Passwords don't match",
                  })}
                  type="password"
                  placeholder="••••••••"
                  className={`input pl-9 ${errors.confirmPassword ? 'input-error' : ''}`}
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              </div>
              {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? <LoadingSpinner size="sm" className="text-white" /> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
