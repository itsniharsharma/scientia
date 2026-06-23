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
    let cancelled = false;
    // Always probe /auth/me on mount — the httpOnly cookie carries the session.
    // If valid: refreshes user object from DB. If not: clears stale Zustand state.
    // The cancelled guard prevents a stale /auth/me 401 from overwriting a
    // setAuth() that completed after this effect started (race on slow networks).
    getCurrentUser()
      .then((user) => { if (!cancelled) setAuth(user); })
      .catch(() => { if (!cancelled) clearAuth(); });
    return () => { cancelled = true; };
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
