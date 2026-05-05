'use client';

import Link from 'next/link';
import type { Content } from '@shared/types';
import { octasToApt, shortAddr } from '@shared/lib/aptos';
import { sanitize } from '@shared/lib/sanitize';

interface Props {
  content: Content;
  index: number;
  variant?: 'compact' | 'full';
  disabled?: boolean;
}

export function ContentRow({ content, index, variant = 'compact', disabled = false }: Props) {
  const ratio = content.upvotes + content.downvotes > 0
    ? Math.round((content.upvotes / (content.upvotes + content.downvotes)) * 100)
    : null;

  const href = `/content/${content.id}`;
  const rank = String(index + 1).padStart(2, '0');

  if (variant === 'full') {
    const titleBlock = (
      <div className="flex items-baseline gap-3 min-w-0 w-full">
        <span className="mono text-[10px] text-muted shrink-0">{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium text-ink">{sanitize(content.title)}</div>
          <div className="mono text-[10px] text-muted mt-0.5 truncate">{shortAddr(content.creator)}</div>
        </div>
      </div>
    );
    return (
      <div className="px-4 md:px-8 py-3 row-divider md:grid md:grid-cols-[minmax(0,1fr)_72px_72px_84px_120px_64px] md:gap-4 md:items-center">
        {disabled ? (
          <div className="cursor-default">{titleBlock}</div>
        ) : (
          <Link href={href} className="block">{titleBlock}</Link>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 md:contents">
          <span className="tag-type">{content.contentType}</span>
          <span className="text-[11px] md:text-[12px] font-medium text-ink">{content.totalSales} sales</span>
          <span
            className={`mono text-[11px] px-2 py-0.5 inline-block ${ratio !== null && ratio >= 80 ? 'bg-accent text-always-dark' : 'bg-faint text-ink'}`}
          >
            {ratio !== null ? `${ratio}%` : '—'}
          </span>
          <span className="text-[11px] md:text-[12px] font-medium ml-auto md:ml-0">{octasToApt(content.price).toFixed(2)} ShelbyUSD</span>
          {disabled ? (
            <span className="text-center mono text-[9px] uppercase tracking-label text-muted px-2 py-2">Sample</span>
          ) : (
            <Link href={href} className="btn-small text-center">Buy</Link>
          )}
        </div>
      </div>
    );
  }

  const compactInner = (
    <>
      <div className="flex items-start gap-3 min-w-0 md:contents">
        <span className="mono text-[10px] text-muted shrink-0">{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium text-ink">{sanitize(content.title)}</div>
          <div className="mono text-[10px] text-muted mt-0.5 truncate">{shortAddr(content.creator)}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 md:contents">
        <span className="tag-type">{content.contentType}</span>
        <span className="text-[12px] font-medium ml-auto md:ml-0">{octasToApt(content.price).toFixed(2)} ShelbyUSD</span>
        {disabled ? (
          <span className="text-center mono text-[9px] uppercase tracking-label text-muted px-2 py-2">Sample</span>
        ) : (
          <span className="btn-small text-center">Buy</span>
        )}
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className="block px-4 md:px-8 py-3 row-divider md:grid md:grid-cols-[28px_minmax(0,1fr)_72px_120px_64px] md:gap-4 md:items-center cursor-default">
        {compactInner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block px-4 md:px-8 py-3 row-divider md:grid md:grid-cols-[28px_minmax(0,1fr)_72px_120px_64px] md:gap-4 md:items-center"
    >
      {compactInner}
    </Link>
  );
}
