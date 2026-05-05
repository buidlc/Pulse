'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWalletAuth } from '@frontend/hooks/useWalletAuth';
import { ThemeToggle } from '@frontend/components/shared/ThemeToggle';
import { shortAddr, isAdminWallet } from '@shared/lib/aptos';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: Props) {
  const { signOut, address, connected } = useWalletAuth();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setSignedIn(!!d); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [open]);

  const isAdmin = isAdminWallet(address);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-bg flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 heavy-divider">
        <div className="flex items-center gap-2">
          <span className="display text-[20px] tracking-[-0.02em] leading-none text-ink">PS</span>
          <span className="brand-dot" />
        </div>
        <button onClick={onClose} className="mono text-[11px] uppercase tracking-label text-ink">
          Close
        </button>
      </div>

      <div className="px-6 py-4 row-divider">
        <div className="label">Wallet</div>
        <div className="mono text-[12px] mt-1 text-ink">
          {connected && address ? shortAddr(address) : 'Not connected'}
        </div>
      </div>

      <Link
        href="/dashboard"
        onClick={onClose}
        className="px-6 py-4 row-divider mono text-[12px] uppercase tracking-label text-ink"
      >
        Dashboard
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          onClick={onClose}
          className="px-6 py-4 row-divider mono text-[12px] uppercase tracking-label text-ink"
        >
          Admin
        </Link>
      )}

      <Link
        href="/ledger"
        onClick={onClose}
        className="px-6 py-4 row-divider mono text-[12px] uppercase tracking-label text-ink"
      >
        Ledger
      </Link>

      <ThemeToggle variant="row" />

      {signedIn && (
        <button
          onClick={async () => { await signOut(); setSignedIn(false); onClose(); }}
          className="px-6 py-4 row-divider mono text-[12px] uppercase tracking-label text-ink text-left"
        >
          Sign out
        </button>
      )}

      <div className="flex-1" />

      <div className="px-6 py-4 mono text-[10px] text-muted uppercase tracking-label">
        Built on Shelby x Aptos
      </div>
    </div>
  );
}
