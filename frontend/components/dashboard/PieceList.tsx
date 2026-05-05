'use client';

import Link from 'next/link';
import type { Content } from '@shared/types';
import { octasToApt } from '@shared/lib/aptos';
import { sanitize } from '@shared/lib/sanitize';

interface Props {
  pieces: Content[];
}

export function PieceList({ pieces }: Props) {
  if (pieces.length === 0) {
    return (
      <div className="px-4 md:px-8 py-10 mono text-[10px] text-muted">
        You haven&apos;t published anything yet. Use the &quot;New piece&quot; button to upload your first article, video or course.
      </div>
    );
  }
  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 md:gap-0 px-4 md:px-8 py-4">
        <div className="label">Your pieces — {pieces.length} published</div>
        <div className="mono text-[10px] text-muted">Sorted by earnings</div>
      </div>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="px-4 md:px-8 py-3 row-divider md:grid md:grid-cols-[1fr_70px_80px_80px_56px] md:gap-3 md:items-center"
        >
          <div>
            <div className="text-[12px] font-medium">{sanitize(p.title)}</div>
            <div className="mono text-[10px] text-muted mt-0.5">
              published {new Date(p.publishedAt).toLocaleDateString()} ·{' '}
              {p.contentType === 'course' ? `${(p.lessons?.length ?? 0)} lessons` : p.contentType}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 md:contents">
            <span className="tag-type">{p.contentType}</span>
            <span className="text-[12px] font-medium">{p.totalSales} sales</span>
            <span className="text-[12px] font-medium ml-auto md:ml-0">{octasToApt(p.price * p.totalSales).toFixed(2)} ShelbyUSD</span>
            <Link href={`/content/${p.id}`} className="btn-small text-center">Manage</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
