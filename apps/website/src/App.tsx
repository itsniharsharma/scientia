import { useEffect, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AppRouter } from './app/router';
import { useAuthStore } from './store/auth.store';
import { getCurrentUser } from './lib/auth.api';
import { ErrorBoundary } from './components/ErrorBoundary';

function AuthHydrator({ children }: { children: ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Only validate an existing persisted session. Skip on fresh loads where
    // there is nothing to validate. This prevents a pre-login /auth/me request
    // (which has no cookie) from resolving AFTER a successful login and calling
    // clearAuth(), which would kick the user back to the login page.
    // Stale-session detection for persisted sessions still works because the
    // 401 interceptor in axios.ts calls clearAuth() on any failed API call.
    if (!useAuthStore.getState().isAuthenticated) return;

    let cancelled = false;
    getCurrentUser()
      .then((user) => { if (!cancelled) setAuth(user); })
      .catch(() => { if (!cancelled) clearAuth(); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthHydrator>
            <AppRouter />
          </AuthHydrator>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
