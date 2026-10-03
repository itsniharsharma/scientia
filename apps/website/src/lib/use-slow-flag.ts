import { useEffect, useState } from 'react';

// True once `active` has stayed true for `delayMs` — used to tell the user
// their sign-in is still going (backend cold start) instead of a silent spinner.
export function useSlowFlag(active: boolean, delayMs = 5_000): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return slow;
}
