'use client';

import { useSessionExpiry } from '@frontend/hooks/useSessionExpiry';
import { useWalletAuth } from '@frontend/hooks/useWalletAuth';

export function ExpiryWarning() {
  const { secondsRemaining, showWarning, refresh } = useSessionExpiry();
  const { signIn, status } = useWalletAuth();

  if (!showWarning || secondsRemaining === null) return null;

  const minutes = Math.max(1, Math.ceil(secondsRemaining / 60));

  return (
    <div className="bg-accent text-always-dark px-4 md:px-8 py-2 flex items-center justify-between mono text-[10px] uppercase tracking-label">
      <span>
        Your session expires in {minutes} minute{minutes === 1 ? '' : 's'}. Sign again with your wallet to stay
        connected.
      </span>
      <button
        className="btn-small"
        onClick={async () => {
          const ok = await signIn();
          if (ok) refresh();
        }}
        disabled={status === 'pending'}
      >
        {status === 'pending' ? 'Signing…' : 'Re-sign'}
      </button>
    </div>
  );
}
