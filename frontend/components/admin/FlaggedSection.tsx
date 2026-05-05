'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import type { Content } from '@shared/types';
import { buildSetContentActiveTx } from '@shared/lib/contracts';
import { aptos, shortAddr, octasToApt } from '@shared/lib/aptos';
import { invalidateHome } from '@frontend/lib/invalidate';
import { sanitize } from '@shared/lib/sanitize';

interface Props {
  flagged: Content[];
  onChange?: () => void;
}

export function FlaggedSection({ flagged, onChange }: Props) {
  const { signAndSubmitTransaction } = useWallet();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: number) => {
    setError(null);
    setBusy(id);
    try {
      const tx = buildSetContentActiveTx(id, false);
      const r = await signAndSubmitTransaction(tx);
      const hash = r.hash ?? r.txnHash ?? '';
      if (hash) await aptos.waitForTransaction({ transactionHash: hash });
      await invalidateHome();
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section>
      <div className="flex justify-between items-center px-4 md:px-6 py-4">
        <div className="label">Flagged content — needs action</div>
        <div className="mono text-[10px] text-muted">{flagged.length}</div>
      </div>

      {flagged.length === 0 ? (
        <div className="px-4 md:px-6 py-8 mono text-[10px] text-muted">No flagged content.</div>
      ) : flagged.map((c) => (
        <div
          key={c.id}
          className="px-4 md:px-6 py-3 row-divider md:grid md:grid-cols-[1fr_120px_100px_80px] md:gap-3 md:items-start"
        >
          <div>
            <div className="text-[12px] font-medium">{sanitize(c.title)}</div>
            <div className="mono text-[10px] text-muted mt-1 leading-relaxed">
              Auto-flagged after {c.downvotes} downvotes (threshold reached).
            </div>
          </div>
          <div className="mono text-[10px] text-muted mt-1 md:mt-0">{shortAddr(c.creator)}</div>
          <div className="mono text-[10px] text-muted mt-1 md:mt-0">
            {c.downvotes} downvotes — {octasToApt(c.downvotes * 10_000_000).toFixed(2)} ShelbyUSD in pool
          </div>
          <div className="flex flex-row md:flex-col gap-2 md:gap-1 mt-2 md:mt-0">
            <button onClick={() => remove(c.id)} disabled={busy === c.id} className="btn-small flex-1 md:flex-none">
              Remove
            </button>
            <button onClick={() => onChange?.()} className="btn-small flex-1 md:flex-none">Dismiss</button>
          </div>
        </div>
      ))}

      {error && <div className="px-4 md:px-6 py-3 mono text-[10px] text-ink">{error}</div>}
    </section>
  );
}
