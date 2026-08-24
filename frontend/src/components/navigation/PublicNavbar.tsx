import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Menu, X } from 'lucide-react';
import { useAuthStore, useCurrentUser } from '../../store/authStore';
import { authApi } from '../../api';

const PublicNavbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, clearAuth } = useAuthStore();
  const user = useCurrentUser();
  const navigate = useNavigate();

  const dashboardLink = () => {
    if (!user) return '/login';
    return { PATIENT: '/patient/dashboard', DOCTOR: '/doctor/dashboard', ADMIN: '/admin/dashboard' }[user.role] || '/login';
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary-600 no-underline">
            <Heart className="w-6 h-6" />
            <span className="font-bold text-lg text-foreground">HealthCare</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground no-underline transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link to={dashboardLink()} className="text-sm font-medium text-muted-foreground hover:text-foreground no-underline">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn-outline text-sm">
                  Sign Out
                </button>
              </>
            )}
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden text-muted-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3 animate-fade-in">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="block text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn-primary w-full text-center block" onClick={() => setOpen(false)}>Get Started</Link>
            </>
          ) : (
            <>
              <Link to={dashboardLink()} className="block text-sm font-medium" onClick={() => setOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="btn-outline w-full">Sign Out</button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
