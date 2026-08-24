import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

const DoctorAppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/doctor/consultation/${id}`} replace />;
};

export default DoctorAppointmentDetail;
