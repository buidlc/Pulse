import type { PlatformStats } from '@shared/types';

interface Props {
  stats: PlatformStats;
  feesCollectedApt: number;
}

const DESKTOP_COL_CLASS: Record<number, string> = {
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
};

export function AdminStats({ stats, feesCollectedApt }: Props) {
  const cells: Array<{ label: string; value: string; sub?: string; tag?: string }> = [
    { label: 'Total content on-chain', value: String(stats.totalContent) },
    { label: 'Total sales', value: String(stats.totalSales) },
    { label: 'Protocol fees collected', value: feesCollectedApt.toFixed(2), sub: 'ShelbyUSD collected', tag: '1% of all sales' },
    { label: 'Flagged items', value: String(stats.flaggedCount), sub: 'need review' },
    { label: 'Vote transactions', value: String(stats.totalVoteTxs), sub: '0.1 ShelbyUSD each' },
  ];
  const cols = DESKTOP_COL_CLASS[cells.length] ?? 'md:grid-cols-5';
  return (
    <div className={`heavy-divider grid grid-cols-2 ${cols}`}>
      {cells.map((c, i) => {
        return (
          <div
            key={i}
            className="px-4 md:px-6 py-4 md:py-5"
          >
            <div className="label-tight mb-2">{c.label}</div>
            <div className="display text-[26px] md:text-[34px] leading-none">{c.value}</div>
            {c.sub && <div className="mono text-[10px] text-muted mt-1">{c.sub}</div>}
            {c.tag && <span className="tag-lime mt-2 inline-block">{c.tag}</span>}
          </div>
        );
      })}
    </div>
  );
}
