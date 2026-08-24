import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Calendar, Clock, ArrowRight, UserCheck, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/60 to-background py-20 lg:py-28 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100/80 text-primary-800 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen AI Healthcare Appointment Management</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                Smarter Appointments, <span className="text-primary">Better Care</span> with AI Assistance
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Experience seamless patient-doctor scheduling with intelligent pre-visit symptom intake,
                real-time slot availability, automated post-visit summaries, and medication reminders.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
                <Link to="/register" className="btn-primary btn-lg shadow-md hover:shadow-lg gap-2">
                  Book an Appointment <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="btn-outline btn-lg">
                  Sign In to Portal
                </Link>
              </div>
              <div className="flex items-center gap-6 justify-center lg:justify-start text-xs text-muted-foreground pt-4">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Verified Specialists</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Zero Double-Booking Guarantee</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Google Calendar Sync</div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="card shadow-modal border-primary/20 bg-card/95 backdrop-blur space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                      Dr
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Dr. Sarah Jenkins</div>
                      <div className="text-xs text-muted-foreground">Cardiologist • 12 yrs exp</div>
                    </div>
                  </div>
                  <span className="badge-success">Available Today</span>
                </div>

                <div className="bg-primary-50/60 p-3.5 rounded-md border border-primary-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-900">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>AI Pre-Visit Intake Analysis</span>
                  </div>
                  <p className="text-xs text-primary-800 leading-relaxed">
                    "Urgency: Moderate. Chief complaint: Chest tightness upon exertion. Recommended triage questions prepared for physician review."
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-md bg-muted/60 font-medium">09:30 AM</div>
                  <div className="p-2.5 rounded-md bg-primary text-primary-foreground font-semibold">10:00 AM</div>
                  <div className="p-2.5 rounded-md bg-muted/60 font-medium">10:30 AM</div>
                </div>

                <Link to="/patient/doctors" className="btn-primary w-full text-center block">
                  Find Doctors & Schedule
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Engineered for Clinical Precision</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            From patient symptom intake to clinical prescriptions and follow-up reminders.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold">Real-Time Slot Engine</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dynamically computes availability from doctor working hours, leaves, and booked intervals with strict database locking against double-booking.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold">AI Pre & Post-Visit Summaries</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Provides doctors with symptom urgency triage before consultation and delivers clear, simplified follow-up guides to patients afterwards.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold">Automated Medication Reminders</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scheduled background jobs translate physician prescriptions into timely email and calendar reminders tailored to each dosage schedule.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold">Role-Based Portals</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dedicated, secure interfaces for Patients, Doctors, and Clinic Administrators with strict boundary isolation and JWT authorization.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold">Doctor Leave Management</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Admins can configure physician leaves with automatic conflict detection, patient notification dispatch, and slot blackouts.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold">Digital Prescriptions</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Structured clinical notes, medication names, dosages, and instructions accessible anytime from the patient dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Portals CTA */}
      <section className="bg-muted/50 border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to streamline your healthcare appointments?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Create a patient account in seconds or sign in to access doctor and administrative management tools.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="btn-primary btn-lg">Create Free Patient Account</Link>
            <Link to="/login" className="btn-outline btn-lg">Staff & Admin Login</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
