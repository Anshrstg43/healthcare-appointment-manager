import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/navigation/PublicNavbar';

const PublicLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <PublicNavbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} Healthcare Appointment Manager. All rights reserved.
    </footer>
  </div>
);

export default PublicLayout;
