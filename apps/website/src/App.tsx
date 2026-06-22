import { useEffect, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AppRouter } from './app/router';
import { useAuthStore } from './store/auth.store';
import { getCurrentUser } from './lib/auth.api';

function AuthHydrator({ children }: { children: ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Always probe /auth/me on mount — the httpOnly cookie carries the session.
    // If valid: refreshes user object from DB. If not: clears stale Zustand state.
    getCurrentUser()
      .then((user) => setAuth(user))
      .catch(() => clearAuth());
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
