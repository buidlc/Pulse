import type { ActivityItem } from '@shared/types';
import { shortAddr } from '@shared/lib/aptos';

interface Props { items: ActivityItem[] }

export function ActivityFeed({ items }: Props) {
  return (
    <div>
      <div className="label px-4 md:px-8 py-4">Recent activity</div>
      {items.length === 0 ? (
        <div className="px-4 md:px-8 py-10 mono text-[10px] text-muted">
          No on-chain activity for your wallet yet.
        </div>
      ) : (
        items.map((it, i) => (
          <div key={i} className="flex justify-between px-4 md:px-8 py-3 row-divider">
            <div>
              <span className={it.type === 'sale' ? 'tag-lime' : 'tag-ink'}>
                {it.type === 'sale' ? 'Sale' : 'Resale royalty'}
              </span>
              <div className="text-[11px] text-ink mt-1">{it.contentTitle}</div>
              <div className="mono text-[10px] text-muted mt-0.5">
                {shortAddr(it.buyerAddress)} · {new Date(it.timestamp).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-medium">{it.amount.toFixed(2)} ShelbyUSD</div>
              <div className="mono text-[10px] text-muted">{it.type === 'sale' ? 'to your wallet' : 'royalty'}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
