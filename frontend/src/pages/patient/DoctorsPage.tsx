import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Stethoscope, Calendar, Clock, Award, ArrowRight } from 'lucide-react';
import { doctorApi } from '../../api';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const DoctorsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  const { data: specializations } = useQuery({
    queryKey: ['doctor-specializations'],
    queryFn: async () => (await doctorApi.search()).data, // Or specializations endpoint
  });

  const { data: doctorsPage, isLoading } = useQuery({
    queryKey: ['doctors-search', selectedSpecialization, searchTerm],
    queryFn: async () =>
      (await doctorApi.search({
        specialization: selectedSpecialization || undefined,
        name: searchTerm || undefined,
        size: 20,
      })).data,
  });

  const doctors = doctorsPage?.content || [];

  return (
    <div className="page space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Find Healthcare Specialists</h1>
        <p className="page-subtitle">
          Search qualified doctors by medical specialization, view verified credentials, and book available appointment slots.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="card bg-card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by doctor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
        </div>

        <div className="w-full sm:w-64 relative">
          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="input pl-9 cursor-pointer"
          >
            <option value="">All Specializations</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Neurology">Neurology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="General Medicine">General Medicine</option>
          </select>
          <Filter className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Doctors Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : doctors.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No doctors found"
            description="Try adjusting your search criteria or clearing your specialization filter."
            action={
              <button
                onClick={() => { setSearchTerm(''); setSelectedSpecialization(''); }}
                className="btn-outline btn-sm mt-2"
              >
                Clear Filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div key={doc.id} className="card flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Dr. {doc.name}</h3>
                    <span className="badge-primary text-[11px] mt-0.5">{doc.specialization}</span>
                  </div>
                </div>

                {doc.qualifications && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Award className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">{doc.qualifications}</span>
                  </div>
                )}

                {doc.experienceYears !== undefined && doc.experienceYears > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{doc.experienceYears}+ years</span> clinical experience
                  </div>
                )}

                {doc.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {doc.bio}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-primary" />
                  {doc.slotDurationMinutes} min slots
                </div>
                <Link
                  to={`/patient/book?doctorId=${doc.id}`}
                  className="btn-primary btn-sm gap-1.5 shadow-sm"
                >
                  <span>Book Slot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;
