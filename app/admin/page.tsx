'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@frontend/components/nav/Navbar';
import { ExpiryWarning } from '@frontend/components/shared/ExpiryWarning';
import { AdminStats } from '@frontend/components/admin/AdminStats';
import { PendingSection } from '@frontend/components/admin/PendingSection';
import { ContentTable } from '@frontend/components/admin/ContentTable';
import { FlaggedSection } from '@frontend/components/admin/FlaggedSection';
import { ProtocolSettings } from '@frontend/components/admin/ProtocolSettings';
import { fetchAllContent, fetchPlatformConfig } from '@shared/lib/contracts';
import { aptos, CONTRACT_ADDRESS, octasToApt, APTOS_NETWORK_LABEL } from '@shared/lib/aptos';
import type { Content, PlatformConfig, PlatformStats } from '@shared/types';

type View = 'pending' | 'all' | 'flagged' | 'settings';

const NAV: Array<{ id: View; label: string; section: string }> = [
  { id: 'pending', label: 'Pending review', section: 'Queue' },
  { id: 'flagged', label: 'Flagged content', section: 'Queue' },
  { id: 'all', label: 'All content', section: 'Catalog' },
  { id: 'settings', label: 'Protocol settings', section: 'System' },
];

export default function AdminPage() {
  const [items, setItems] = useState<Content[]>([]);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [view, setView] = useState<View>('pending');
  const [voteTxCount, setVoteTxCount] = useState(0);
  const [feesCollectedApt, setFeesCollectedApt] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [list, cfg] = await Promise.all([fetchAllContent(), fetchPlatformConfig()]);
    setItems(list);
    setConfig(cfg);

    if (CONTRACT_ADDRESS) {
      try {
        const [voteEvents, soldEvents] = await Promise.all([
          aptos.getEvents({
            options: {
              where: { indexed_type: { _eq: `${CONTRACT_ADDRESS}::platform::VoteCast` } },
              limit: 10000,
            },
          }),
          aptos.getEvents({
            options: {
              where: { indexed_type: { _eq: `${CONTRACT_ADDRESS}::platform::ContentSold` } },
              limit: 10000,
            },
          }),
        ]);
        setVoteTxCount(voteEvents.length);
        const fees = soldEvents.reduce((s, ev) => {
          const d = ev.data as { platform_fee: string };
          return s + octasToApt(d.platform_fee);
        }, 0);
        setFeesCollectedApt(fees);
      } catch {
        setVoteTxCount(0);
        setFeesCollectedApt(0);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const pending = items.filter((c) => c.isPending);
  const flagged = items.filter((c) => c.isFlagged);
  const totalSales = items.reduce((s, c) => s + c.totalSales, 0);
  const stats: PlatformStats = {
    totalContent: items.length,
    totalSales,
    totalFeesCollected: 0, // displayed as feesCollectedApt below
    totalVoteTxs: voteTxCount,
    flaggedCount: flagged.length,
    pendingCount: pending.length,
  };

  const sections = Array.from(new Set(NAV.map((n) => n.section)));

  return (
    <main>
      <Navbar variant="admin" />
      <ExpiryWarning />

      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-2 md:gap-0 px-4 md:px-8 py-5 md:py-6 heavy-divider">
        <div>
          <h1 className="display text-[28px] md:text-[36px] tracking-[-1px] md:tracking-[-1.5px]">Platform overview</h1>
          <div className="mono text-[10px] text-muted mt-2">
            Full control — all actions signed on Shelbynet — irreversible actions require wallet confirmation
          </div>
        </div>
        <div className="mono text-[10px] text-muted md:text-right">
          {new Date().toLocaleDateString()} · {APTOS_NETWORK_LABEL}
        </div>
      </header>

      <AdminStats stats={stats} feesCollectedApt={feesCollectedApt} />

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr]">
        <aside className="py-3 md:py-5 flex md:block overflow-x-auto md:overflow-visible">
          {sections.map((section) => (
            <div key={section} className="md:contents flex md:flex-col items-center gap-1 md:gap-0 px-2 md:px-0">
              <div className="hidden md:block label-tight px-5 pt-3 pb-1">{section}</div>
              {NAV.filter((n) => n.section === section).map((n) => (
                <button
                  key={n.id}
                  onClick={() => setView(n.id)}
                  className={`whitespace-nowrap text-left px-3 md:px-5 py-2 md:w-full mono text-[10px] md:text-[11px] uppercase tracking-label cursor-pointer ${
                    view === n.id
                      ? 'bg-accent text-always-dark font-medium'
                      : 'text-subtext hover:text-ink hover:bg-hover'
                  }`}
                >
                  {n.label}
                  {n.id === 'flagged' && flagged.length > 0 && (
                    <span className="tag-ink ml-2 inline-block">{flagged.length}</span>
                  )}
                  {n.id === 'pending' && pending.length > 0 && (
                    <span className="tag-lime ml-2 inline-block">{pending.length}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <div>
          {loading && <div className="px-4 md:px-6 py-8 mono text-[10px] text-muted">Loading from chain…</div>}
          {!loading && view === 'pending' && <PendingSection pending={pending} onChange={refresh} />}
          {!loading && view === 'flagged' && <FlaggedSection flagged={flagged} onChange={refresh} />}
          {!loading && view === 'all' && <ContentTable rows={items} />}
          {!loading && view === 'settings' && <ProtocolSettings config={config} onChange={refresh} />}
        </div>
      </div>

      {!CONTRACT_ADDRESS && (
        <div className="px-4 md:px-8 py-6 mono text-[10px] bg-accent text-always-dark">
          NEXT_PUBLIC_CONTRACT_ADDRESS is not set — admin actions are read-only until you deploy the Move
          contract and set the address. <Link href="/" className="underline">Back home</Link>
        </div>
      )}
      <div className="mobile-nav-spacer" />
    </main>
  );
}
