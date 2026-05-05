'use client';

import { useState } from 'react';
import type { Content } from '@shared/types';
import { shortAddr } from '@shared/lib/aptos';
import { sanitize } from '@shared/lib/sanitize';

interface Props {
  rows: Content[];
}

function statusBadge(c: Content) {
  if (c.isFlagged) return <span className="tag-ink">Flagged</span>;
  if (c.isPending) return <span className="tag-outline">Pending</span>;
  if (c.isActive) return <span className="tag-lime">Live</span>;
  return <span className="tag-outline">Inactive</span>;
}

export function ContentTable({ rows }: Props) {
  const [q, setQ] = useState('');
  const filtered = rows.filter(
    (r) => !q || r.title.toLowerCase().includes(q.toLowerCase()) || r.creator.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <section>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 px-4 md:px-6 py-4">
        <div className="label">All content</div>
        <input
          className="border-0 mono text-[11px] w-full md:w-[220px] py-2 md:py-1 bg-transparent placeholder:text-muted focus:outline-none"
          placeholder="Search by title or wallet..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_60px_80px] gap-3 px-4 md:px-6 py-2 bg-hover label-tight">
        <span>Title</span><span>Type</span><span>Sales</span><span>Votes</span><span>Status</span><span>Action</span>
      </div>
      {filtered.length === 0 ? (
        <div className="px-4 md:px-6 py-8 mono text-[10px] text-muted">No content matches.</div>
      ) : filtered.map((r) => (
        <div
          key={r.id}
          className="px-4 md:px-6 py-3 row-divider md:grid md:grid-cols-[1fr_80px_80px_80px_60px_80px] md:gap-3 md:items-center"
        >
          <div>
            <div className="text-[12px] font-medium">{sanitize(r.title)}</div>
            <div className="mono text-[10px] text-muted mt-0.5">{shortAddr(r.creator)}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 md:contents">
            <span className="tag-type">{r.contentType}</span>
            <span className="text-[12px] font-medium">{r.totalSales} sales</span>
            <span className="text-[11px]">{r.upvotes} up {r.downvotes} down</span>
            {statusBadge(r)}
            <a className="btn-small text-center ml-auto md:ml-0" href={`/content/${r.id}`} target="_blank" rel="noopener noreferrer">View</a>
          </div>
        </div>
      ))}
    </section>
  );
}
