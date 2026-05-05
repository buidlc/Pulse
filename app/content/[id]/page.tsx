'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export const runtime = 'edge';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Navbar } from '@frontend/components/nav/Navbar';
import { VoteStrip } from '@frontend/components/content/VoteStrip';
import { ReviewList } from '@frontend/components/content/ReviewList';
import { TrustSnapshot } from '@frontend/components/content/TrustSnapshot';
import { LessonList } from '@frontend/components/content/LessonList';
import {
  buildPurchaseTx,
  checkAccess,
  fetchContent,
  fetchCredibilityScore,
} from '@shared/lib/contracts';
import { aptos, octasToApt, shortAddr } from '@shared/lib/aptos';
import { sanitize } from '@shared/lib/sanitize';
import { readBlobAsText } from '@shared/lib/shelby';
import { invalidateHome } from '@frontend/lib/invalidate';
import type { Content } from '@shared/types';

export default function ContentPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [content, setContent] = useState<Content | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [body, setBody] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [credibility, setCredibility] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const refresh = async () => {
    const c = await fetchContent(id);
    setContent(c);
    if (c) {
      setCredibility(await fetchCredibilityScore(c.creator));
      if (account?.address) setHasAccess(await checkAccess(account.address, id));
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [id, account?.address]);

  useEffect(() => {
    if (!hasAccess || !content) return;
    if (content.contentType !== 'article') return;
    let cancelled = false;
    readBlobAsText(content.blobId)
      .then((txt) => {
        if (cancelled) return;
        try {
          const parsed = JSON.parse(txt) as { body?: string };
          setBody(parsed.body ?? txt);
        } catch {
          setBody(txt);
        }
      })
      .catch((e) => setBodyError(e instanceof Error ? e.message : 'Could not load content'));
    return () => { cancelled = true; };
  }, [hasAccess, content]);

  const buy = async () => {
    if (!connected || !content) return;
    setBuyError(null);
    setBuying(true);
    try {
      const tx = buildPurchaseTx(content.id);
      const r = await signAndSubmitTransaction(tx);
      const hash = r.hash ?? r.txnHash ?? '';
      if (hash) await aptos.waitForTransaction({ transactionHash: hash });
      await invalidateHome();
      await refresh();
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'Purchase failed');
    } finally {
      setBuying(false);
    }
  };

  if (loading) return (
    <main>
      <Navbar />
      <div className="px-4 md:px-8 py-16 mono text-[10px] text-muted">Loading from chain…</div>
    </main>
  );

  if (!content) return (
    <main>
      <Navbar />
      <div className="px-4 md:px-8 py-16 mono text-[10px] text-muted">Content not found.</div>
    </main>
  );

  const totalVotes = content.upvotes + content.downvotes;
  const ratio = totalVotes > 0 ? Math.round((content.upvotes / totalVotes) * 100) : null;

  return (
    <main>
      <Navbar />

      <div className="px-4 md:px-8 py-3 mono text-[10px] uppercase text-muted tracking-[0.05em]">
        <Link href="/ledger" className="hover:text-ink">Ledger</Link>
        <span className="mx-2">→</span>
        <span>{content.contentType}</span>
        <span className="mx-2">→</span>
        <span className="text-ink">{sanitize(content.title)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
        <div className="px-4 md:px-8 py-6 md:py-9">
          <span className="tag-type mb-3 inline-block">{content.contentType}</span>
          <h1 className="display text-[30px] md:text-[46px] tracking-[-1px] md:tracking-[-2px] leading-none mb-3">{sanitize(content.title)}</h1>

          <div className="flex justify-between items-center py-3 mb-5">
            <div>
              <div className="text-[12px] font-medium">{shortAddr(content.creator)}</div>
              <div className="mono text-[10px] text-muted mt-0.5">
                On PULSE since {new Date(content.publishedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-ink p-3 text-right">
              <div className="mono text-[9px] text-muted uppercase">Credibility</div>
              <div className="mono text-[14px] font-medium text-accent">{credibility}</div>
              {credibility >= 70 && <div className="tag-lime mt-1 inline-block">Verified creator</div>}
            </div>
          </div>

          <VoteStrip content={content} hasAccess={hasAccess} onVoted={refresh} />

          {!hasAccess && (
            <div className="text-center mono text-[10px] text-muted bg-faint py-2 mb-4">
              Voting is only open to verified buyers. Connect your wallet and purchase to vote. Every vote is a
              signed transaction on Shelbynet.
            </div>
          )}

          {/* Preview / unlocked content */}
          {content.contentType === 'article' && (
            <div className="bg-hover p-5">
              {hasAccess ? (
                bodyError ? (
                  <div className="mono text-[10px] text-ink">{bodyError}</div>
                ) : body ? (
                  <pre className="whitespace-pre-wrap mono text-[12px] leading-[1.8] text-ink">{body}</pre>
                ) : (
                  <div className="mono text-[10px] text-muted">Loading from Shelby…</div>
                )
              ) : (
                <>
                  <div className="mono text-[12px] leading-[1.8] text-subtext">
                    Preview is hidden because the article body is encrypted with the buyer access list. Purchase
                    once and the full text streams from Shelby into your browser, signed by your wallet.
                  </div>
                  <div className="preview-cutoff mt-3" />
                  <div className="text-center mono text-[10px] text-muted mt-2">
                    Purchase to unlock full article
                  </div>
                </>
              )}
            </div>
          )}

          {content.contentType === 'video' && (
            <div className="bg-hover h-[200px] flex items-center justify-center">
              <span className="mono text-[12px] font-medium">{hasAccess ? 'Unlocked — open Shelby blob' : 'Preview locked'}</span>
            </div>
          )}

          {content.contentType === 'course' && (
            <LessonList lessons={content.lessons ?? []} hasAccess={hasAccess} />
          )}

          <div className="mt-10">
            <ReviewList contentId={content.id} />
          </div>
        </div>

        <aside className="px-4 md:px-6 py-6 md:py-7 lg:border-t-0">
          <div className="pt-4 mb-5">
            <div className="label mb-1">Price</div>
            <div className="display text-[40px] md:text-[50px] leading-none">{octasToApt(content.price).toFixed(2)}</div>
            <div className="mono text-[10px] text-muted mt-1">ShelbyUSD</div>
          </div>

          {hasAccess ? (
            <div className="tag-lime block text-center py-2 mb-3">You own this</div>
          ) : (
            <button onClick={buy} disabled={!connected || buying} className="btn-primary w-full mb-2">
              {buying ? 'Signing…' : 'Buy now'}
            </button>
          )}
          {buyError && <div className="mono text-[10px] text-ink mb-3">{buyError}</div>}
          <div className="mono text-[10px] text-muted text-center mb-4">
            Access token sent to your wallet instantly
          </div>

          <TrustSnapshot content={content} />

          {ratio !== null && (
            <div className="mono text-[10px] text-muted">
              {totalVotes} verified votes · {content.totalSales} sales
            </div>
          )}
        </aside>
      </div>
      <div className="mobile-nav-spacer" />
    </main>
  );
}
