import React, { useState } from 'react';
import { useCurrentUser } from '../../store/authStore';
import { User, Mail, Phone, Shield, HeartPulse, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toaster';

const PatientProfile: React.FC = () => {
  const user = useCurrentUser();
  const { success: toastSuccess } = useToast();

  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('Penicillin (mild hives), Peanuts');
  const [chronicConditions, setChronicConditions] = useState('Mild Seasonal Asthma, Hypertension');
  const [emergencyContactName, setEmergencyContactName] = useState('Sarah Morgan');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+1-555-0188');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toastSuccess('Medical Profile Updated', 'Your medical records and emergency contacts are saved.');
  };

  return (
    <div className="page max-w-3xl space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Patient Profile & Medical Records</h1>
        <p className="page-subtitle">Your personal account details, clinical history, and emergency settings.</p>
      </div>

      <div className="card space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
            <span className="badge-primary text-xs mt-1">Verified Patient Account</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <Mail className="w-4 h-4 text-primary" />
            <div>
              <span className="text-[11px] text-muted-foreground block">Email</span>
              <span className="font-medium text-foreground text-xs">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <Phone className="w-4 h-4 text-primary" />
            <div>
              <span className="text-[11px] text-muted-foreground block">Phone</span>
              <span className="font-medium text-foreground text-xs">{user?.phone || 'Not provided'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <Shield className="w-4 h-4 text-primary" />
            <div>
              <span className="text-[11px] text-muted-foreground block">Security</span>
              <span className="font-medium text-foreground text-xs">Standard Patient</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Medical History Form */}
      <form onSubmit={handleSave} className="card space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <HeartPulse className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Clinical Background & Allergies</h3>
            <p className="text-xs text-muted-foreground">Shared securely with your consulting physician</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="label text-xs">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="input text-xs"
            >
              <option value="A+">A+ (A Positive)</option>
              <option value="A-">A- (A Negative)</option>
              <option value="B+">B+ (B Positive)</option>
              <option value="B-">B- (B Negative)</option>
              <option value="AB+">AB+ (AB Positive)</option>
              <option value="AB-">AB- (AB Negative)</option>
              <option value="O+">O+ (O Positive)</option>
              <option value="O-">O- (O Negative)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="label text-xs">Drug / Food Allergies</label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
              className="input text-xs"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="label text-xs">Chronic Medical Conditions / Past Surgeries</label>
            <textarea
              rows={2}
              value={chronicConditions}
              onChange={(e) => setChronicConditions(e.target.value)}
              placeholder="e.g. Asthma, Hypertension, Diabetes Type 2, Appendectomy (2020)"
              className="input text-xs resize-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-primary" />
            <span>Emergency Contact Details</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label text-xs">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Full Name"
                className="input text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="label text-xs">Emergency Contact Phone</label>
              <input
                type="text"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="input text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button type="submit" className="btn-primary gap-2 text-xs shadow-sm">
            <Save className="w-4 h-4" />
            <span>Save Medical Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientProfile;
