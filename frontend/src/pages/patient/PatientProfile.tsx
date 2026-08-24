import React from 'react';
import { useCurrentUser } from '../../store/authStore';
import { User, Mail, Phone, Shield } from 'lucide-react';

const PatientProfile: React.FC = () => {
  const user = useCurrentUser();

  return (
    <div className="page max-w-2xl space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Patient Profile</h1>
        <p className="page-subtitle">Your personal account details and communication settings.</p>
      </div>

      <div className="card space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
            <span className="badge-primary text-xs mt-1">Patient Account</span>
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
            <Phone className="w-4 h-4 text-primary" />
            <div>
              <span className="text-xs text-muted-foreground block">Phone</span>
              <span className="font-medium text-foreground">{user?.phone || 'Not provided'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <Shield className="w-4 h-4 text-primary" />
            <div>
              <span className="text-xs text-muted-foreground block">Role & Access</span>
              <span className="font-medium text-foreground">Standard Patient Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
