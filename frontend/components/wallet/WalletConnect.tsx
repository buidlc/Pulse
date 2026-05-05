'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useWalletAuth } from '@frontend/hooks/useWalletAuth';
import { shortAddr, isAdminWallet } from '@shared/lib/aptos';

interface Props {
  compact?: boolean;
}

export function WalletConnect({ compact = false }: Props) {
  const { connect, disconnect, connected, account, wallets } = useWallet();
  const { status, signIn, signOut, error } = useWalletAuth();
  const [signedIn, setSignedIn] = useState(false);
  const [noWalletNotice, setNoWalletNotice] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data) setSignedIn(true); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [connected]);

  useEffect(() => { if (status === 'authenticated') setSignedIn(true); }, [status]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const handleConnect = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (!wallets || wallets.length === 0) {
      setNoWalletNotice(true);
      return;
    }
    setNoWalletNotice(false);
    try {
      await connect(wallets[0].name);
    } catch (err) {
      console.error('[pulse] connect failed', err);
    }
  };

  const handleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const ok = await signIn();
    if (ok) setSignedIn(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setSignedIn(false);
    setMenuOpen(false);
    await disconnect();
  };

  const isAdmin = isAdminWallet(account?.address);

  if (!connected) {
    return (
      <div className="relative">
        <button onClick={handleConnect} className={compact ? 'btn-small' : 'btn-primary'}>
          <span className="md:hidden">Connect</span>
          <span className="hidden md:inline">Connect wallet</span>
        </button>
        {noWalletNotice && (
          <div className="absolute right-0 top-full mt-2 z-50 bg-bg w-[280px] p-4 mono text-[10px] text-ink heavy-divider">
            <div className="label mb-2">No Aptos wallet detected</div>
            <p className="leading-relaxed mb-2 text-subtext">
              Desktop: install Petra at <a className="underline" href="https://petra.app" target="_blank" rel="noopener noreferrer">petra.app</a>.
            </p>
            <p className="leading-relaxed mb-2 text-subtext">
              Mobile: open this site inside <a className="underline" href="https://kiwibrowser.com" target="_blank" rel="noopener noreferrer">Kiwi Browser</a> (Android) or <a className="underline" href="https://www.mises.site" target="_blank" rel="noopener noreferrer">Mises Browser</a> (Android/iOS) and install Petra.
            </p>
            <button onClick={() => setNoWalletNotice(false)} className="btn-small mt-2">Dismiss</button>
          </div>
        )}
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden md:inline mono text-[10px] text-muted uppercase">{shortAddr(account?.address)}</span>
        <button onClick={handleSignIn} disabled={status === 'pending'} className={compact ? 'btn-small' : 'btn-primary'}>
          {status === 'pending' ? 'Signing…' : 'Sign in'}
        </button>
        {error && <span className="hidden md:inline mono text-[10px] text-ink">{error}</span>}
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button onClick={() => setMenuOpen((v) => !v)} className={compact ? 'btn-small' : 'btn-outline'}>
        <span className="md:hidden">{shortAddr(account?.address, 4, 3)}</span>
        <span className="hidden md:inline">{shortAddr(account?.address)}</span>
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-bg w-[220px] heavy-divider">
          <div className="px-4 py-3 row-divider">
            <div className="label">Connected wallet</div>
            <div className="mono text-[10px] text-ink mt-1 break-all">{shortAddr(account?.address, 8, 6)}</div>
            {isAdmin && <div className="tag-lime mt-2 inline-block">Admin</div>}
          </div>
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-3 row-divider mono text-[11px] uppercase tracking-label text-ink"
          >
            Dashboard
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 row-divider mono text-[11px] uppercase tracking-label text-ink"
            >
              Admin panel
            </Link>
          )}
          <Link
            href="/upload"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-3 row-divider mono text-[11px] uppercase tracking-label text-ink"
          >
            New piece
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 mono text-[11px] uppercase tracking-label text-ink"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
