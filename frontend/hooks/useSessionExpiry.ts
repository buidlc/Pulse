'use client';

import { useEffect, useState, useCallback } from 'react';

interface DecodedExp {
  exp: number;
  wallet?: string;
  role?: string;
}

function decodeJWT(token: string): DecodedExp | null {
  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) return null;
    const padded = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function useSessionExpiry(): {
  secondsRemaining: number | null;
  showWarning: boolean;
  refresh: () => void;
} {
  const [secondsRemaining, setSeconds] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      if (!res.ok) {
        setSeconds(null);
        return;
      }
      const { exp } = (await res.json()) as { exp: number };
      const remaining = exp - Math.floor(Date.now() / 1000);
      setSeconds(remaining > 0 ? remaining : 0);
    } catch {
      setSeconds(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const showWarning = secondsRemaining !== null && secondsRemaining > 0 && secondsRemaining < 15 * 60;
  return { secondsRemaining, showWarning, refresh };
}
