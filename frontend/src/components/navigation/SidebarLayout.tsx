import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Heart, LucideIcon } from 'lucide-react';
import { useAuthStore, useCurrentUser } from '../../store/authStore';
import { authApi } from '../../api';
import { cn } from '../../utils/cn';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface SidebarLayoutProps {
  navItems: NavItem[];
  portalLabel: string;
  accentColor: 'primary' | 'accent' | 'warning';
}

const accentClasses = {
  primary: 'bg-primary-600',
  accent:  'bg-accent-600',
  warning: 'bg-amber-600',
};

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ navItems, portalLabel, accentColor }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useCurrentUser();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-6 py-5', accentClasses[accentColor])}>
        <Heart className="text-white w-6 h-6" />
        <div>
          <div className="text-white font-bold text-sm leading-tight">HealthCare</div>
          <div className="text-white/70 text-xs">{portalLabel}</div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-foreground truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'active')
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <button onClick={handleLogout} className="nav-item w-full text-destructive hover:bg-red-50 hover:text-destructive">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-card border-r border-border">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 flex flex-col animate-slide-up">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">HealthCare</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
