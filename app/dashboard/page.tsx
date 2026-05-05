import Link from 'next/link';
import { Navbar } from '@frontend/components/nav/Navbar';
import { ExpiryWarning } from '@frontend/components/shared/ExpiryWarning';
import { StatsRow } from '@frontend/components/dashboard/StatsRow';
import { PieceList } from '@frontend/components/dashboard/PieceList';

export const runtime = 'edge';
import { ActivityFeed } from '@frontend/components/dashboard/ActivityFeed';
import { RoyaltySidebar } from '@frontend/components/dashboard/RoyaltySidebar';
import { getServerSession } from '@backend/lib/session';
import { fetchAllContent } from '@shared/lib/contracts';
import { aptos, CONTRACT_ADDRESS, octasToApt, shortAddr } from '@shared/lib/aptos';
import type { ActivityItem } from '@shared/types';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function fetchActivity(wallet: string): Promise<{
  sales: ActivityItem[];
  resaleRoyalties: ActivityItem[];
  feesPaidApt: number;
}> {
  if (!CONTRACT_ADDRESS) return { sales: [], resaleRoyalties: [], feesPaidApt: 0 };
  try {
    const [soldEvents, resaleEvents] = await Promise.all([
      aptos.getEvents({
        options: {
          where: {
            indexed_type: { _eq: `${CONTRACT_ADDRESS}::platform::ContentSold` },
            data: { _contains: { creator: wallet } },
          },
          limit: 100,
          orderBy: [{ transaction_block_height: 'desc' }],
        },
      }),
      aptos.getEvents({
        options: {
          where: {
            indexed_type: { _eq: `${CONTRACT_ADDRESS}::platform::ContentResold` },
            data: { _contains: { creator: wallet } },
          },
          limit: 100,
          orderBy: [{ transaction_block_height: 'desc' }],
        },
      }),
    ]);

    let feesPaidApt = 0;
    const sales: ActivityItem[] = soldEvents.map((ev) => {
      const d = ev.data as { content_id: string; buyer: string; price: string; platform_fee: string; timestamp: string };
      feesPaidApt += octasToApt(d.platform_fee);
      return {
        type: 'sale',
        contentId: parseInt(d.content_id, 10),
        contentTitle: `Content #${d.content_id}`,
        amount: octasToApt(d.price) - octasToApt(d.platform_fee),
        buyerAddress: d.buyer,
        txHash: ev.transaction_version ?? '',
        timestamp: new Date(parseInt(d.timestamp, 10) * 1000).toISOString(),
      };
    });
    const resaleRoyalties: ActivityItem[] = resaleEvents.map((ev) => {
      const d = ev.data as { content_id: string; new_buyer: string; creator_royalty: string; timestamp: string };
      return {
        type: 'resale_royalty',
        contentId: parseInt(d.content_id, 10),
        contentTitle: `Content #${d.content_id}`,
        amount: octasToApt(d.creator_royalty),
        buyerAddress: d.new_buyer,
        txHash: ev.transaction_version ?? '',
        timestamp: new Date(parseInt(d.timestamp, 10) * 1000).toISOString(),
      };
    });
    return { sales, resaleRoyalties, feesPaidApt };
  } catch {
    return { sales: [], resaleRoyalties: [], feesPaidApt: 0 };
  }
}

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect('/?signin=required');

  const wallet = session.wallet;
  const [all, activity] = await Promise.all([
    withTimeout(fetchAllContent(), 4000, [] as Awaited<ReturnType<typeof fetchAllContent>>),
    withTimeout(fetchActivity(wallet), 4000, { sales: [], resaleRoyalties: [], feesPaidApt: 0 }),
  ]);
  const mine = all.filter((c) => c.creator.toLowerCase() === wallet.toLowerCase());

  const totalEarnedApt = activity.sales.reduce((s, a) => s + a.amount, 0);
  const royaltiesEarnedApt = activity.resaleRoyalties.reduce((s, a) => s + a.amount, 0);
  const thisMonthCutoff = new Date();
  thisMonthCutoff.setDate(1);
  const thisMonth = activity.sales.filter((a) => new Date(a.timestamp) >= thisMonthCutoff);
  const thisMonthApt = thisMonth.reduce((s, a) => s + a.amount, 0);

  return (
    <main>
      <Navbar />
      <ExpiryWarning />

      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-0 px-4 md:px-8 py-6 md:py-7 heavy-divider">
        <div>
          <Link href="/" className="mono text-[10px] uppercase tracking-label text-muted hover:text-ink mb-3 inline-block">
            ← Back to home
          </Link>
          <div className="label mb-2">Creator dashboard</div>
          <h1 className="display text-[28px] md:text-[38px] tracking-[-1px] md:tracking-[-1.5px] leading-none">Your earnings. Your content.</h1>
          <div className="mono text-[11px] text-muted mt-2">{shortAddr(wallet)}</div>
        </div>
        <Link href="/upload" className="btn-lime self-start md:self-auto">New piece</Link>
      </header>

      <StatsRow
        stats={[
          { label: 'Total earned', value: totalEarnedApt.toFixed(2), sub: 'ShelbyUSD lifetime' },
          { label: 'Total sales', value: String(activity.sales.length), sub: `across ${mine.length} pieces` },
          {
            label: 'Resale royalties',
            value: royaltiesEarnedApt.toFixed(2),
            sub: `ShelbyUSD from ${activity.resaleRoyalties.length} resales`,
            tag: 'Passive income',
          },
          { label: 'This month', value: thisMonthApt.toFixed(2), sub: `ShelbyUSD — ${thisMonth.length} sales` },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px]">
        <div className="order-2 lg:order-1">
          <PieceList pieces={mine} />
          <ActivityFeed items={[...activity.sales, ...activity.resaleRoyalties].slice(0, 30)} />
        </div>
        <div className="order-1 lg:order-2 lg:border-b-0">
          <RoyaltySidebar
            pieces={mine}
            royaltiesEarnedApt={royaltiesEarnedApt}
            royaltyTxCount={activity.resaleRoyalties.length}
            primarySalesCount={activity.sales.length}
            resalesCount={activity.resaleRoyalties.length}
            protocolFeesPaidApt={activity.feesPaidApt}
          />
        </div>
      </div>
      <div className="mobile-nav-spacer" />
    </main>
  );
}
