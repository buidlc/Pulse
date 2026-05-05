'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Navbar } from '@frontend/components/nav/Navbar';
import { LiveTicker } from '@frontend/components/nav/LiveTicker';
import { ContentRow } from '@frontend/components/content/ContentRow';
import { fetchAllContent, fetchPlatformConfig } from '@shared/lib/contracts';
import { PREVIEW_CONTENT, PREVIEW_STATS, PREVIEW_BANNER_LONG, PREVIEW_BANNER_SHORT } from '@shared/lib/preview';
import {
  octasToApt,
  CONTRACT_ADDRESS,
  shortAddr,
  explorerAccountUrl,
} from '@shared/lib/aptos';
import type { Content, PlatformConfig } from '@shared/types';

export default function Home() {
  // Render with preview data immediately so the page never blocks on RPC.
  // Background fetch upgrades to live data when (and if) it returns.
  const [content, setContent] = useState<Content[]>(PREVIEW_CONTENT);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [isPreview, setIsPreview] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([fetchAllContent(), fetchPlatformConfig()]).then(
      ([contentRes, configRes]) => {
        if (cancelled) return;

        if (contentRes.status === 'fulfilled') {
          const live = contentRes.value.filter(
            (c) => c.isActive && !c.isPending && !c.isFlagged,
          );
          if (live.length > 0) {
            setContent(contentRes.value);
            setIsPreview(false);
          }
        }
        if (configRes.status === 'fulfilled' && configRes.value) {
          setConfig(configRes.value);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const liveContent = content.filter(
    (c) => c.isActive && !c.isPending && !c.isFlagged,
  );
  const top = liveContent.slice(0, 5);

  const realPieces = content.length;
  const realSales = content.reduce((sum, c) => sum + c.totalSales, 0);
  const realUpvotes = content.reduce((sum, c) => sum + c.upvotes, 0);
  const realEarningsApt = content.reduce(
    (sum, c) => sum + octasToApt(c.price * c.totalSales),
    0,
  );

  const piecesCount = isPreview ? PREVIEW_STATS.pieces : realPieces;
  const salesCount = isPreview ? PREVIEW_STATS.sales : realSales;
  const upvotesCount = isPreview ? PREVIEW_STATS.upvotes : realUpvotes;
  const earningsApt = isPreview ? PREVIEW_STATS.earningsApt : realEarningsApt;

  return (
    <main className="snap-container">
      {isPreview && (
        <div className="bg-always-dark text-accent py-2 px-4 md:px-8 mono text-[10px] tracking-[0.05em] uppercase text-center">
          <span className="hidden md:inline">{PREVIEW_BANNER_LONG}</span>
          <span className="md:hidden">{PREVIEW_BANNER_SHORT}</span>
        </div>
      )}
      <Navbar />

      {/* ───────────── Section 1 — Hero ───────────── */}
      <section className="snap-page container-page flex flex-col md:grid md:grid-rows-[auto_minmax(0,1fr)_auto] px-4 md:px-8 py-10 md:py-14 gap-10 md:gap-12 md:min-h-[calc(100vh_-_72px)]">
        {/* Top row — headline + paragraph/CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <div>
            <div className="inline-block bg-accent text-always-dark mono text-[11px] md:text-[12px] uppercase tracking-[0.12em] font-medium px-2.5 py-1.5 mb-4">
              Powered by Shelby
            </div>
            <div className="label mb-4 md:mb-5 flex items-center gap-2">
              <span className="brand-dot" />
              <span>Decentralized creator protocol — Shelbynet</span>
            </div>
            <h1 className="display text-[28px] sm:text-[34px] md:text-[42px] lg:text-[48px] leading-[1.1] tracking-[-1px] text-ink">
              Sell what you know. Earn forever.
            </h1>
          </div>
          <div className="flex flex-col gap-6">
            <p className="mono text-[12px] md:text-[13px] leading-[1.9] text-subtext">
              PULSE lets creators publish articles, videos and courses straight to a decentralized network. Buyers
              get a wallet-native access token. Every vote, sale and resale royalty is a signed transaction on
              Shelbynet. No accounts. No takedowns. No middlemen.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/upload" className="btn-primary">Start selling</Link>
              <Link href="/ledger" className="btn-outline">Browse ledger</Link>
            </div>
          </div>
        </div>

        {/* Middle row — fills the gap on tall screens */}
        <div className="flex flex-col justify-center">
          <div className="label mb-5 flex items-center gap-2">
            <span className="brand-dot" />
            <span>What you get</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 border-t border-faint pt-6">
            <div>
              <div className="label-tight mb-3 text-ink">For creators</div>
              <ul className="mono text-[12px] text-subtext leading-[2] space-y-0.5">
                <li>Wallet-native publishing</li>
                <li>Instant ShelbyUSD settlement</li>
                <li>Resale royalties forever</li>
                <li>1% platform fee, hard-capped</li>
              </ul>
            </div>
            <div>
              <div className="label-tight mb-3 text-ink">For buyers</div>
              <ul className="mono text-[12px] text-subtext leading-[2] space-y-0.5">
                <li>Lifetime on-chain access</li>
                <li>No platform between you</li>
                <li>Own what you paid for</li>
                <li>Vote with your wallet</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row — scroll cue + stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <div className="hidden md:flex items-end gap-3 text-muted mono text-[10px] uppercase tracking-label">
            <span>↓</span>
            <span>Scroll — see it on-chain</span>
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6 pt-5 border-t border-faint">
            <div>
              <div className="display text-[22px] md:text-[26px] leading-none text-ink">{piecesCount}</div>
              <div className="label-tight mt-2">Pieces on-chain</div>
            </div>
            <div>
              <div className="display text-[22px] md:text-[26px] leading-none text-ink">{earningsApt.toFixed(1)}</div>
              <div className="label-tight mt-2">ShelbyUSD to creators</div>
            </div>
            <div>
              <div className="display text-[22px] md:text-[26px] leading-none text-ink">{upvotesCount}</div>
              <div className="label-tight mt-2">Upvotes cast</div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Section 2 — Live ledger ───────────── */}
      <section className="snap-page md:min-h-[calc(100vh_-_72px)] flex flex-col">
        <LiveTicker />
        <div className="container-page grid grid-cols-1 lg:grid-cols-3 px-4 md:px-8 py-10 md:py-14 gap-8 md:gap-12 flex-1">
          <div className="lg:col-span-2">
            <div className="label mb-4 flex items-center gap-2">
              <span className="brand-dot" />
              <span>On-chain right now</span>
            </div>
            <h2 className="display text-[28px] md:text-[44px] tracking-[-1px] leading-tight mb-6 md:mb-8 text-ink">
              Live from the ledger.
            </h2>
            {top.length === 0 ? (
              <div className="py-12 mono text-[11px] text-muted">
                No content has been published yet.{' '}
                <Link href="/upload" className="underline text-ink">Be the first creator.</Link>
              </div>
            ) : (
              <>
                {top.map((c, i) => <ContentRow key={c.id} content={c} index={i} disabled={isPreview} />)}
                <div className="py-3">
                  <Link href="/ledger" className="mono text-[11px] uppercase tracking-label underline text-ink">
                    View all on the ledger →
                  </Link>
                </div>
              </>
            )}
          </div>

          <div>
            <div className="label mb-5">Why it works</div>
            <div className="space-y-8">
              <div className="pt-1">
                <div className="display text-[28px] leading-none text-ink">∞</div>
                <div className="label mt-2">Forever</div>
                <div className="mono text-[11px] text-subtext leading-[1.8] mt-2">
                  Stored on Shelby&apos;s decentralized network. No server. No downtime. No takedowns.
                </div>
              </div>
              <div className="pt-1">
                <div className="display text-[24px] leading-none text-ink">Instant</div>
                <div className="label mt-2">Earnings</div>
                <div className="mono text-[11px] text-subtext leading-[1.8] mt-2">
                  No waiting. No invoices. ShelbyUSD lands in your wallet the moment someone buys.
                </div>
              </div>
              <div className="pt-1">
                <div className="display text-[28px] leading-none text-ink">0</div>
                <div className="label mt-2">Platform risk</div>
                <div className="mono text-[11px] text-subtext leading-[1.8] mt-2">
                  No bans. No content removals. The smart contract is the only authority.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Section 3 — Proof + final push ───────────── */}
      <section className="snap-page md:min-h-[calc(100vh_-_72px)] flex flex-col container-page px-4 md:px-8 py-10 md:py-14">
        <div className="label mb-4 flex items-center gap-2">
          <span className="brand-dot" />
          <span>Protocol stats — live on Shelbynet</span>
        </div>
        <h2 className="display text-[36px] md:text-[64px] lg:text-[72px] tracking-[-2px] leading-[1.02] mb-8 md:mb-12 text-ink">
          Don&apos;t trust. Verify.
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 md:gap-x-10 gap-y-8 mb-10 md:mb-12">
          <div className="pt-1">
            <div className="display text-[40px] md:text-[64px] leading-none text-ink">{piecesCount}</div>
            <div className="label-tight mt-3">Pieces on-chain</div>
          </div>
          <div className="pt-1">
            <div className="display text-[40px] md:text-[64px] leading-none text-ink">{salesCount}</div>
            <div className="label-tight mt-3">Total sales</div>
          </div>
          <div className="pt-1">
            <div className="display text-[40px] md:text-[64px] leading-none text-ink">{earningsApt.toFixed(1)}</div>
            <div className="label-tight mt-3">ShelbyUSD to creators</div>
          </div>
          <div className="pt-1">
            <div className="display text-[40px] md:text-[64px] leading-none text-ink">{upvotesCount}</div>
            <div className="label-tight mt-3">Upvotes cast</div>
          </div>
        </div>

        {CONTRACT_ADDRESS && (
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3 md:gap-8 py-5 md:py-6 border-t border-faint mb-8 md:mb-10 items-center">
            <div className="label-tight">Contract</div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <code className="mono text-[12px] md:text-[13px] text-ink break-all">
                {shortAddr(CONTRACT_ADDRESS)}
              </code>
              <a
                href={explorerAccountUrl(CONTRACT_ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-[10px] uppercase tracking-label underline text-ink"
              >
                View on explorer →
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mb-auto">
          <Link href="/upload" className="btn-primary">Upload your first piece</Link>
          {CONTRACT_ADDRESS && (
            <a
              href={`https://explorer.aptoslabs.com/account/${CONTRACT_ADDRESS}/modules?network=shelbynet`}
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-[11px] uppercase tracking-label underline text-ink"
            >
              Read the contract
            </a>
          )}
        </div>

        {config && (
          <div className="mono text-[10px] text-muted mt-8 md:mt-10">
            Platform fee: {(config.feeBps / 100).toFixed(2)}% · Vote cost: {octasToApt(config.voteCost)} ShelbyUSD
          </div>
        )}

        <footer className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 py-6 mt-8 md:mt-10 border-t border-faint">
          <div className="flex items-center gap-2">
            <span className="display text-[16px] tracking-[-0.02em] leading-none">PS</span>
            <span className="brand-dot" />
          </div>
          <div className="flex flex-wrap gap-4 md:gap-6 mono text-[10px] uppercase text-muted tracking-label">
            <Link href="/docs">Docs</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
          <div className="mono text-[10px] uppercase text-muted">Built on Shelbynet</div>
        </footer>
      </section>

      <div className="mobile-nav-spacer" />
    </main>
  );
}
