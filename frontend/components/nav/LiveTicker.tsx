'use client';

import { useEffect, useState } from 'react';
import { aptos, CONTRACT_ADDRESS, octasToApt, shortAddr } from '@shared/lib/aptos';

interface TickerEntry {
  buyer: string;
  amount: number;
  title: string;
}

export function LiveTicker() {
  const [entries, setEntries] = useState<TickerEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!CONTRACT_ADDRESS) return;

    async function load() {
      try {
        const events = await aptos.getEvents({
          options: {
            where: {
              indexed_type: { _eq: `${CONTRACT_ADDRESS}::platform::ContentSold` },
            },
            limit: 12,
            orderBy: [{ transaction_block_height: 'desc' }],
          },
        });
        if (cancelled) return;
        const mapped: TickerEntry[] = events.map((ev) => {
          const data = ev.data as { buyer: string; price: string; content_id: string };
          return {
            buyer: data.buyer,
            amount: octasToApt(data.price),
            title: `Content #${data.content_id}`,
          };
        });
        setEntries(mapped);
      } catch (err) {
        setEntries([]);
      }
    }

    load();
    const interval = setInterval(load, 10_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (entries.length === 0) return null;

  const text = entries
    .map((e) => `LIVE  ◆  ${shortAddr(e.buyer)}  ◆  ${e.amount.toFixed(2)} ShelbyUSD  ◆  ${e.title}`)
    .join('  ◆  ');

  return (
    <div className="bg-always-dark text-accent py-2 marquee mono text-[10px] tracking-[0.05em] uppercase">
      <div className="marquee-track">{text}  ◆  {text}</div>
    </div>
  );
}
