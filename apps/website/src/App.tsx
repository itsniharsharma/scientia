import { useEffect, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AppRouter } from './app/router';
import { useAuthStore } from './store/auth.store';
import { getCurrentUser } from './lib/auth.api';

function AuthHydrator({ children }: { children: ReactNode }) {
  const { token, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    getCurrentUser()
      .then((user) => setAuth(user, token))
      .catch(() => clearAuth());
    // Run once on mount to validate stored token against the server
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthHydrator>
          <AppRouter />
        </AuthHydrator>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
