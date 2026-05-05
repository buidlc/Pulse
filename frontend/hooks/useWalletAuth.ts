'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface AuthState {
  status: 'idle' | 'pending' | 'authenticated' | 'error';
  error?: string;
}

function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function normalizeSignature(signature: unknown): string {
  if (!signature) return '';
  if (typeof signature === 'string') return signature.startsWith('0x') ? signature : '0x' + signature;
  if (signature instanceof Uint8Array) return bytesToHex(signature);
  const s = signature as { data?: { bytes?: Uint8Array }; signature?: unknown };
  if (s.data?.bytes) return bytesToHex(s.data.bytes);
  if (s.signature) return normalizeSignature(s.signature);
  return String(signature);
}

function normalizePubkey(pk: unknown): string {
  if (!pk) return '';
  if (typeof pk === 'string') return pk.startsWith('0x') ? pk : '0x' + pk;
  if (pk instanceof Uint8Array) return bytesToHex(pk);
  const p = pk as { key?: { data?: Uint8Array } };
  if (p.key?.data) return bytesToHex(p.key.data);
  return String(pk);
}

export function useWalletAuth() {
  const { connected, account, signMessage } = useWallet();
  const [state, setState] = useState<AuthState>({ status: 'idle' });

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!connected || !account?.address) {
      setState({ status: 'error', error: 'Connect a wallet first' });
      return false;
    }
    setState({ status: 'pending' });
    try {
      const wallet = account.address;

      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });
      if (!nonceRes.ok) throw new Error('Nonce request failed');
      const { nonce, message } = (await nonceRes.json()) as { nonce: string; message: string };

      const signed = await signMessage({
        message,
        nonce,
      });

      const signature = normalizeSignature(
        signed.signature ?? signed.fullMessage ?? signed,
      );
      const publicKey = normalizePubkey(account.publicKey);
      const messageOut: string = signed.fullMessage ?? message;

      const login = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          nonce,
          signature,
          publicKey,
          message: messageOut,
        }),
      });
      if (!login.ok) {
        const text = await login.text();
        throw new Error(text || 'Sign-in failed');
      }
      setState({ status: 'authenticated' });
      return true;
    } catch (err) {
      setState({ status: 'error', error: err instanceof Error ? err.message : 'Sign-in failed' });
      return false;
    }
  }, [connected, account, signMessage]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setState({ status: 'idle' });
  }, []);

  return { ...state, signIn, signOut, connected, address: account?.address ?? null };
}
