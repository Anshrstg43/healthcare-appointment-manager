import React from 'react';
import { cn } from '../../utils/cn';
import type { AppointmentStatus } from '../../types';

const labels: Record<AppointmentStatus, string> = {
  HELD:        'Held',
  CONFIRMED:   'Confirmed',
  COMPLETED:   'Completed',
  CANCELLED:   'Cancelled',
  RESCHEDULED: 'Rescheduled',
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => (
  <span className={cn(`status-${status}`, className)}>
    {labels[status] || status}
  </span>
);

export default StatusBadge;
