import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn('skeleton h-4 w-full', className)} />
);

export const CardSkeleton: React.FC = () => (
  <div className="card space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
    <Skeleton className="h-8 w-28 rounded-md" />
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="stat-card">
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-3 w-32" />
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3 border-t border-border">
        <Skeleton className={cn('h-4', i === 0 ? 'w-32' : 'w-20')} />
      </td>
    ))}
  </tr>
);
