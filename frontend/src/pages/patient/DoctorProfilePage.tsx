import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Stethoscope, Award, Clock, ArrowRight, Calendar, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { doctorApi } from '../../api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const DoctorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor-profile', id],
    queryFn: async () => (await doctorApi.getById(Number(id))).data,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="page flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="page text-center py-16">
        <h2 className="text-xl font-bold">Doctor not found</h2>
        <Link to="/patient/doctors" className="btn-outline btn-sm mt-4">Back to Doctors</Link>
      </div>
    );
  }

  return (
    <div className="page max-w-4xl space-y-8 animate-fade-in">
      <div className="card space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dr. {doctor.name}</h1>
              <p className="text-sm font-medium text-primary">{doctor.specialization}</p>
              {doctor.qualifications && (
                <p className="text-xs text-muted-foreground mt-0.5">{doctor.qualifications}</p>
              )}
            </div>
          </div>

          <Link
            to={`/patient/book?doctorId=${doctor.id}`}
            className="btn-primary btn-lg gap-2 shadow-md w-full sm:w-auto"
          >
            <Calendar className="w-5 h-5" />
            <span>Book Consultation</span>
          </Link>
        </div>

        {/* Bio */}
        {doctor.bio && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Professional Background</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{doctor.bio}</p>
          </div>
        )}

        {/* Clinical Info Grid */}
        <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="p-3 bg-muted/40 rounded-lg space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>Consultation Duration</span>
            </div>
            <div className="text-sm font-semibold text-foreground">{doctor.slotDurationMinutes} Minutes</div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Award className="w-4 h-4 text-primary" />
              <span>Experience</span>
            </div>
            <div className="text-sm font-semibold text-foreground">{doctor.experienceYears || 0}+ Years</div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Status</span>
            </div>
            <div className="text-sm font-semibold text-success">Accepting Patients</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
