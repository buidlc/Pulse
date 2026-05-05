'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { buildVoteTx } from '@shared/lib/contracts';
import { aptos } from '@shared/lib/aptos';
import { invalidateHome } from '@frontend/lib/invalidate';
import type { Content } from '@shared/types';

interface Props {
  content: Content;
  hasAccess: boolean;
  onVoted?: () => void;
}

export function VoteStrip({ content, hasAccess, onVoted }: Props) {
  const { signAndSubmitTransaction, connected } = useWallet();
  const [pending, setPending] = useState<'up' | 'down' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const total = content.upvotes + content.downvotes;
  const ratio = total > 0 ? Math.round((content.upvotes / total) * 100) : 50;

  const cast = async (isUpvote: boolean) => {
    if (!hasAccess || !connected) return;
    setErr(null);
    setPending(isUpvote ? 'up' : 'down');
    try {
      const tx = buildVoteTx(content.id, isUpvote);
      const res = await signAndSubmitTransaction(tx);
      const hash: string = res.hash ?? res.txnHash ?? '';
      if (hash) await aptos.waitForTransaction({ transactionHash: hash });
      await invalidateHome();
      onVoted?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Vote failed');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="grid grid-cols-3 mb-5">
      <div className="px-4 py-3">
        <div className="display text-[24px] text-ink leading-none">{content.upvotes}</div>
        <div className="label-tight mt-1">Upvotes</div>
        <div className="tag-lime mt-1">0.1 ShelbyUSD to creator</div>
        <button
          className="btn-small mt-3 w-full"
          disabled={!hasAccess || pending !== null}
          onClick={() => cast(true)}
        >
          {pending === 'up' ? 'Signing…' : 'Upvote'}
        </button>
      </div>
      <div className="px-4 py-3">
        <div className="display text-[24px] text-muted leading-none">{content.downvotes}</div>
        <div className="label-tight mt-1">Downvotes</div>
        <div className="tag-ink mt-1">0.1 ShelbyUSD to pool</div>
        <button
          className="btn-small mt-3 w-full"
          disabled={!hasAccess || pending !== null}
          onClick={() => cast(false)}
        >
          {pending === 'down' ? 'Signing…' : 'Downvote'}
        </button>
      </div>
      <div className="px-4 py-3">
        <div className="display text-[28px] text-ink leading-none">{ratio}%</div>
        <div className="label-tight mt-1">Positive ratio</div>
        <div className="h-1 bg-faint mt-2 relative">
          <div className="absolute left-0 top-0 h-full bg-accent" style={{ width: `${ratio}%` }} />
        </div>
        <div className="mono text-[10px] text-muted mt-2">{total} verified votes</div>
        {err && <div className="mono text-[10px] text-ink mt-2">{err}</div>}
      </div>
    </div>
  );
}
