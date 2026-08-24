import React from 'react';
import { useCurrentUser } from '../../store/authStore';
import { Stethoscope, Mail, Clock, Calendar } from 'lucide-react';

const DoctorProfile: React.FC = () => {
  const user = useCurrentUser();

  return (
    <div className="page max-w-2xl space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Doctor Profile</h1>
        <p className="page-subtitle">Your credentials and clinical practice profile.</p>
      </div>

      <div className="card space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Dr. {user?.name}</h2>
            <span className="badge-primary text-xs mt-1">Specialist Physician</span>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <Mail className="w-4 h-4 text-primary" />
            <div>
              <span className="text-xs text-muted-foreground block">Email</span>
              <span className="font-medium text-foreground">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <Clock className="w-4 h-4 text-primary" />
            <div>
              <span className="text-xs text-muted-foreground block">Default Slot Duration</span>
              <span className="font-medium text-foreground">30 Minutes per consultation</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <span className="text-xs text-muted-foreground block">Practice Schedule</span>
              <span className="font-medium text-foreground">Monday to Friday (09:00 AM - 05:00 PM)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
