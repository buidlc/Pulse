'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@frontend/components/nav/Navbar';
import { ContentRow } from '@frontend/components/content/ContentRow';
import { PREVIEW_CONTENT, PREVIEW_BANNER_LONG, PREVIEW_BANNER_SHORT } from '@shared/lib/preview';
import type { Content, ContentType } from '@shared/types';

type Tab = 'all' | ContentType;
type Sort = 'recent' | 'sold' | 'rated' | 'low' | 'high';

const PAGE_SIZE = 20;

export default function LedgerPage() {
  // Start with preview already loaded so the page renders instantly. If the
  // background fetch returns real on-chain content, swap to it.
  const [items, setItems] = useState<Content[]>(PREVIEW_CONTENT);
  const [isPreview, setIsPreview] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch('/api/content')
      .then((r) => r.json())
      .then((data: Content[]) => {
        const live = data.filter((c) => c.isActive && !c.isPending);
        if (live.length > 0) {
          setItems(live);
          setIsPreview(false);
        }
      })
      .catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (tab !== 'all') list = list.filter((c) => c.contentType === tab);
    list = [...list];
    if (sort === 'recent') list.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
    if (sort === 'sold') list.sort((a, b) => b.totalSales - a.totalSales);
    if (sort === 'rated') {
      list.sort((a, b) => {
        const ra = a.upvotes + a.downvotes ? a.upvotes / (a.upvotes + a.downvotes) : 0;
        const rb = b.upvotes + b.downvotes ? b.upvotes / (b.upvotes + b.downvotes) : 0;
        return rb - ra;
      });
    }
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    if (sort === 'high') list.sort((a, b) => b.price - a.price);
    return list;
  }, [items, tab, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main>
      {isPreview && (
        <div className="bg-always-dark text-accent py-2 px-4 md:px-8 mono text-[10px] tracking-[0.05em] uppercase text-center">
          <span className="hidden md:inline">{PREVIEW_BANNER_LONG}</span>
          <span className="md:hidden">{PREVIEW_BANNER_SHORT}</span>
        </div>
      )}
      <Navbar />

      <header className="container-page flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-0 px-4 md:px-8 py-6 md:py-8">
        <div>
          <h1 className="display text-[26px] md:text-[34px] tracking-[-0.5px] md:tracking-[-1px] leading-none">LEDGER</h1>
          <div className="mono text-[10px] text-muted mt-2">
            The on-chain record of everything published on PULSE.
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-5">
          <div className="mono text-[10px] text-muted">{filtered.length} items</div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="border-0 bg-hover mono text-[11px] uppercase tracking-label py-2 px-3 text-ink cursor-pointer focus:bg-faint"
          >
            <option value="recent">Recent</option>
            <option value="sold">Most sold</option>
            <option value="rated">Highest rated</option>
            <option value="low">Price low to high</option>
            <option value="high">Price high to low</option>
          </select>
        </div>
      </header>

      <div className="flex overflow-x-auto">
        {(['all', 'article', 'video', 'course'] as Tab[]).map((t, i, arr) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-5 md:px-7 py-3 mono text-[11px] uppercase tracking-label whitespace-nowrap ${
              ''
            } ${tab === t ? 'bg-ink text-bg' : 'text-muted'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {slice.length === 0 ? (
        <div className="px-4 md:px-8 py-16 mono text-[10px] text-muted text-center">
          No content yet. <Link href="/upload" className="underline text-ink">Publish the first piece.</Link>
        </div>
      ) : (
        slice.map((c, i) => (
          <ContentRow key={c.id} content={c} index={(page - 1) * PAGE_SIZE + i} variant="full" disabled={isPreview} />
        ))
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 px-4 md:px-8 py-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-small"
          >
            Previous
          </button>
          <span className="mono text-[10px] text-muted">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn-small"
          >
            Next
          </button>
        </div>
      )}
      <div className="mobile-nav-spacer" />
    </main>
  );
}
