'use client';

import { useEffect, useState } from 'react';
import { aptos, CONTRACT_ADDRESS, explorerTxUrl, shortAddr } from '@shared/lib/aptos';

interface VoteEvent {
  voter: string;
  is_upvote: boolean;
  timestamp: string;
  txHash: string;
}

interface Props {
  contentId: number;
}

export function ReviewList({ contentId }: Props) {
  const [events, setEvents] = useState<VoteEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!CONTRACT_ADDRESS) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const raw = await aptos.getEvents({
          options: {
            where: {
              indexed_type: { _eq: `${CONTRACT_ADDRESS}::platform::VoteCast` },
              data: { _contains: { content_id: contentId.toString() } },
            },
            limit: 100,
            orderBy: [{ transaction_block_height: 'desc' }],
          },
        });
        if (cancelled) return;
        const mapped: VoteEvent[] = raw.map((ev) => {
          const data = ev.data as { voter: string; is_upvote: boolean; timestamp: string };
          return {
            voter: data.voter,
            is_upvote: data.is_upvote,
            timestamp: data.timestamp,
            txHash: ev.transaction_version ?? '',
          };
        });
        setEvents(mapped);
      } catch {
        setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [contentId]);

  if (loading) {
    return <div className="mono text-[10px] text-muted py-6 text-center">Loading verified votes…</div>;
  }

  if (events.length === 0) {
    return <div className="mono text-[10px] text-muted py-6 text-center">No verified votes yet.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="label">Verified buyer reviews</div>
        <div className="mono text-[10px] text-muted">{events.length}</div>
      </div>
      {events.map((ev, i) => (
        <div key={i} className="py-3 row-divider">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] font-medium">{shortAddr(ev.voter)}</div>
              <a
                href={explorerTxUrl(String(ev.txHash))}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-[9px] text-muted underline"
              >
                Verified owner — view on explorer
              </a>
            </div>
            <span className={ev.is_upvote ? 'tag-lime' : 'tag-ink'}>{ev.is_upvote ? 'Upvote' : 'Downvote'}</span>
          </div>
          <div className="mono text-[9px] text-muted mt-1">
            {new Date(parseInt(ev.timestamp, 10) * 1000).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
