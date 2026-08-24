import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRouter from './routes/AppRouter';
import { ToastProvider } from './components/ui/Toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
