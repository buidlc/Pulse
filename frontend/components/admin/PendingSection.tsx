'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import type { Content } from '@shared/types';
import { buildSetContentActiveTx } from '@shared/lib/contracts';
import { aptos, shortAddr } from '@shared/lib/aptos';
import { invalidateHome } from '@frontend/lib/invalidate';
import { sanitize } from '@shared/lib/sanitize';

interface Props {
  pending: Content[];
  onChange?: () => void;
}

export function PendingSection({ pending, onChange }: Props) {
  const { signAndSubmitTransaction } = useWallet();
  const [busy, setBusy] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const act = async (id: number, isActive: boolean) => {
    setError(null);
    setBusy(id);
    try {
      const tx = buildSetContentActiveTx(id, isActive);
      const submitted = await signAndSubmitTransaction(tx);
      const hash = submitted.hash ?? submitted.txnHash ?? '';
      if (hash) await aptos.waitForTransaction({ transactionHash: hash });
      await invalidateHome();
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(null);
      setRejecting(null);
      setReason('');
    }
  };

  return (
    <section>
      <div className="flex justify-between items-center px-4 md:px-6 py-4">
        <div className="label">Pending review — awaiting your approval</div>
        <div className="mono text-[10px] text-muted">{pending.length}</div>
      </div>

      {pending.length === 0 && (
        <div className="px-4 md:px-6 py-8 mono text-[10px] text-muted">No pending items.</div>
      )}

      {pending.map((c) => (
        <div
          key={c.id}
          className="px-4 md:px-6 py-3 row-divider md:grid md:grid-cols-[1fr_120px_80px_80px_80px] md:gap-3 md:items-center"
        >
          <div>
            <div className="text-[12px] font-medium">{sanitize(c.title)}</div>
            <div className="mono text-[10px] text-muted mt-0.5">
              {shortAddr(c.creator)} · submitted {new Date(c.submittedAt).toLocaleString()}
            </div>
            {rejecting === c.id && (
              <div className="mt-2">
                <input
                  className="input-line"
                  placeholder="Reason for rejection (logged off-chain)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button onClick={() => act(c.id, false)} disabled={busy === c.id} className="btn-small mt-2">
                  Confirm rejection
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 md:contents">
            <span className="tag-type">{c.contentType}</span>
            <a
              className="btn-small text-center"
              href={`/content/${c.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview
            </a>
            <button onClick={() => act(c.id, true)} disabled={busy === c.id} className="btn-small">
              {busy === c.id ? '…' : 'Approve'}
            </button>
            <button
              onClick={() => setRejecting(rejecting === c.id ? null : c.id)}
              className="btn-small"
            >
              Reject
            </button>
          </div>
        </div>
      ))}

      {error && <div className="mono text-[10px] text-ink px-4 md:px-6 py-3">{error}</div>}
    </section>
  );
}
