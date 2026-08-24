import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback safe dummy object if rendered outside provider
    return {
      toast: () => {},
      success: (title: string, msg?: string) => console.log('[Toast Success]', title, msg),
      error: (title: string, msg?: string) => console.error('[Toast Error]', title, msg),
      info: (title: string, msg?: string) => console.log('[Toast Info]', title, msg),
      warning: (title: string, msg?: string) => console.warn('[Toast Warning]', title, msg),
    };
  }
  return ctx;
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error:   <XCircle    className="w-5 h-5 text-destructive" />,
  info:    <Info        className="w-5 h-5 text-primary" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
};

const toastClasses: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50',
  error:   'border-red-200 bg-red-50',
  info:    'border-primary-200 bg-primary-50',
  warning: 'border-amber-200 bg-amber-50',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (title, message) => addToast({ type: 'success', title, message }),
    error:   (title, message) => addToast({ type: 'error',   title, message }),
    info:    (title, message) => addToast({ type: 'info',    title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-modal animate-slide-up',
              toastClasses[toast.type]
            )}
          >
            <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{toast.title}</div>
              {toast.message && (
                <div className="text-xs text-muted-foreground mt-0.5">{toast.message}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
