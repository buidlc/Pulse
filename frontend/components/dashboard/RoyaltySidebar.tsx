import type { Content } from '@shared/types';
import { octasToApt, shortAddr, CONTRACT_ADDRESS } from '@shared/lib/aptos';

interface Props {
  pieces: Content[];
  royaltiesEarnedApt: number;
  royaltyTxCount: number;
  primarySalesCount: number;
  resalesCount: number;
  protocolFeesPaidApt: number;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-[10px] py-1.5 row-divider">
      <span className="text-muted">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

export function RoyaltySidebar(p: Props) {
  return (
    <aside>
      <div className="p-5">
        <div className="label mb-4">Resale royalties</div>
        <div className="display text-[36px] leading-none mb-1">{p.royaltiesEarnedApt.toFixed(2)}</div>
        <div className="mono text-[10px] text-muted">earned from {p.royaltyTxCount} resales across your content</div>
        <div className="mt-4">
          {p.pieces.map((c) => (
            <Row key={c.id} k={c.title.slice(0, 24)} v={`${octasToApt(c.price * c.totalSales * (c.royaltyBps / 10000)).toFixed(3)} ShelbyUSD`} />
          ))}
        </div>
        <div className="mt-3 pt-3 mono text-[10px] text-muted leading-relaxed">
          Royalties land in your wallet automatically. No claiming needed.
        </div>
      </div>
      <div className="p-5">
        <div className="label mb-4">On-chain summary</div>
        <Row k="Pieces" v={String(p.pieces.length)} />
        <Row k="Primary sales" v={String(p.primarySalesCount)} />
        <Row k="Resales" v={String(p.resalesCount)} />
        <Row k="Protocol fees paid" v={`${p.protocolFeesPaidApt.toFixed(3)} ShelbyUSD`} />
        <Row k="Network" v="Shelbynet" />
        <Row k="Storage" v="Shelby" />
        <Row k="Contract" v={shortAddr(CONTRACT_ADDRESS) || '—'} />
      </div>
    </aside>
  );
}
