import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, icon }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      {icon || <AlertCircle className="w-8 h-8 text-muted-foreground" />}
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
    )}
    {action}
  </div>
);

export default EmptyState;
