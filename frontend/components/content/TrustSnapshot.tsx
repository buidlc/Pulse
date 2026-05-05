import type { Content } from '@shared/types';
import { shortAddr, CONTRACT_ADDRESS, APTOS_NETWORK_LABEL } from '@shared/lib/aptos';

interface Props {
  content: Content;
}

function Row({ k, v, highlight = false }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-[10px] py-1 row-divider">
      <span className="text-muted">{k}</span>
      <span className={highlight ? 'bg-accent text-always-dark px-1 font-medium' : 'font-medium'}>{v}</span>
    </div>
  );
}

export function TrustSnapshot({ content }: Props) {
  const total = content.upvotes + content.downvotes;
  const ratio = total > 0 ? Math.round((content.upvotes / total) * 100) : null;

  return (
    <div className="bg-hover p-4 mb-4">
      <div className="label mb-3">Trust snapshot</div>
      <Row k="Total sales" v={String(content.totalSales)} />
      <Row k="Upvote ratio" v={ratio !== null ? `${ratio}%` : '—'} highlight={ratio !== null && ratio >= 80} />
      <Row k="Verified votes" v={String(total)} />
      <Row k="Royalty on resales" v={`${(content.royaltyBps / 100).toFixed(1)}%`} />
      <Row k="Allow resale" v={content.allowResale ? 'Yes' : 'No'} />
      <Row k="Status" v={content.status} />

      <div className="mt-4">
        <div className="label mb-2">On-chain details</div>
        <Row k="Content ID" v={`#${content.id}`} />
        <Row k="Stored on" v="Shelby" />
        <Row k="Contract" v={shortAddr(CONTRACT_ADDRESS, 6, 4) || '—'} />
        <Row k="Network" v={APTOS_NETWORK_LABEL} />
        <Row k="Protocol fee" v="1%" />
        <Row k="Vote cost" v="0.1 ShelbyUSD" />
      </div>
    </div>
  );
}
