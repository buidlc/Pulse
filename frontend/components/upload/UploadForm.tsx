'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { DropZone } from './DropZone';
import { LessonBuilder, type DraftLesson } from './LessonBuilder';
import { buildPublishTx } from '@shared/lib/contracts';
import { aptos, explorerTxUrl } from '@shared/lib/aptos';
import { invalidateHome } from '@frontend/lib/invalidate';
import type { ContentType } from '@shared/types';

type Tab = 'article' | 'video' | 'course';
const TABS: Tab[] = ['article', 'video', 'course'];

interface UploadResult { blobId: string }

declare global {
  interface Window { turnstile?: { render: (...a: unknown[]) => string; reset: (id: string) => void; getResponse: (id: string) => string | undefined } }
}

export function UploadForm() {
  const { signAndSubmitTransaction, connected } = useWallet();
  const [tab, setTab] = useState<Tab>('article');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [thumb, setThumb] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [lessons, setLessons] = useState<DraftLesson[]>([]);
  const [priceApt, setPriceApt] = useState('1.5');
  const [allowResale, setAllowResale] = useState(true);
  const [royaltyPct, setRoyaltyPct] = useState('5');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ hash: string } | null>(null);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_KEY;

  async function uploadOne(file: File, kind: 'blob' | 'video'): Promise<UploadResult> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    fd.append('title', title);
    const turnstileToken = (typeof window !== 'undefined' && window.turnstile && document.querySelector<HTMLElement>('#turnstile-anchor'))
      ? (window.turnstile.getResponse('turnstile-anchor') ?? '')
      : '';
    fd.append('turnstile', turnstileToken);
    const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  }

  const submit = async () => {
    setError(null);
    setSuccess(null);
    if (!connected) { setError('Connect a wallet'); return; }
    if (!title.trim()) { setError('Title required'); return; }
    const price = parseFloat(priceApt);
    if (Number.isNaN(price) || price <= 0) { setError('Price must be > 0 ShelbyUSD'); return; }
    const royaltyBps = Math.round(parseFloat(royaltyPct || '0') * 100);
    if (royaltyBps < 0 || royaltyBps > 5000) { setError('Royalty must be 0–50%'); return; }

    try {
      let primaryBlobId = '';
      if (tab === 'article') {
        if (!body.trim()) { setError('Article body required'); return; }
        setBusy('Uploading article to Shelby…');
        const blob = new Blob([JSON.stringify({ title, description, body })], { type: 'application/pdf' });
        const file = new File([blob], 'article.pdf', { type: 'application/pdf' });
        primaryBlobId = (await uploadOne(file, 'blob')).blobId;
      } else if (tab === 'video') {
        if (!video) { setError('Video file required'); return; }
        setBusy('Transcoding + uploading video to Shelby…');
        primaryBlobId = (await uploadOne(video, 'video')).blobId;
      } else {
        if (lessons.length === 0) { setError('At least one lesson required'); return; }
        setBusy('Uploading lessons to Shelby…');
        const lessonBlobs: { title: string; blobId: string }[] = [];
        for (const l of lessons) {
          if (!l.file) { setError(`Lesson "${l.title}" needs a file`); return; }
          const id = (await uploadOne(l.file, 'video')).blobId;
          lessonBlobs.push({ title: l.title, blobId: id });
        }
        const manifest = new Blob([JSON.stringify({ title, description, lessons: lessonBlobs })], { type: 'application/pdf' });
        primaryBlobId = (await uploadOne(new File([manifest], 'course.pdf', { type: 'application/pdf' }), 'blob')).blobId;
      }

      if (thumb) {
        setBusy('Uploading thumbnail…');
        await uploadOne(thumb, 'blob');
      }

      setBusy('Signing publish transaction…');
      const tx = buildPublishTx({
        blobId: primaryBlobId,
        title,
        priceApt: price,
        contentType: tab as ContentType,
        royaltyBps,
        allowResale,
      });
      const submitted = await signAndSubmitTransaction(tx);
      const hash: string = submitted.hash ?? submitted.txnHash ?? '';
      if (hash) await aptos.waitForTransaction({ transactionHash: hash });
      await invalidateHome();
      setSuccess({ hash });
      setBusy(null);
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : 'Publish failed');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
      <div className="p-4 md:p-8 order-2 lg:order-1">
        <div className="flex mb-6 md:mb-8 overflow-x-auto">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 md:px-7 py-3 mono text-[11px] uppercase tracking-label whitespace-nowrap ${
                ''
              } ${tab === t ? 'bg-ink text-accent' : 'text-muted'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="label">Title</label>
        <input className="input-line mb-6" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is this called?" />

        <label className="label">Description</label>
        <textarea
          className="textarea-block mb-6"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short blurb buyers will see in the ledger"
        />

        {tab === 'article' && (
          <>
            <label className="label">Body (markdown)</label>
            <textarea
              className="textarea-block mb-6 min-h-[300px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your article. Markdown supported."
            />
          </>
        )}

        {tab === 'video' && (
          <div className="mb-6">
            <DropZone
              label="Drop your video here"
              hint="MP4 — Max 4GB — Transcoded by Shelby media kit"
              accept="video/mp4"
              onFile={setVideo}
              selected={video?.name ?? null}
            />
          </div>
        )}

        {tab === 'course' && (
          <div className="mb-6">
            <LessonBuilder lessons={lessons} onChange={setLessons} />
          </div>
        )}

        <DropZone
          label="Thumbnail"
          hint="JPG / PNG / WEBP — Max 5MB"
          accept="image/jpeg,image/png,image/webp"
          onFile={setThumb}
          selected={thumb?.name ?? null}
        />

        {error && <div className="mt-6 mono text-[10px] text-ink bg-faint p-3">{error}</div>}
        {busy && <div className="mt-6 mono text-[10px] text-ink">{busy}</div>}
        {success && (
          <div className="mt-6 mono text-[10px] text-ink bg-accent p-3">
            Content submitted for review. It will go live once approved.{' '}
            {success.hash && (
              <a href={explorerTxUrl(success.hash)} target="_blank" rel="noopener noreferrer" className="underline">
                View transaction
              </a>
            )}
          </div>
        )}
      </div>

      <div className="p-4 md:p-7 order-1 lg:order-2 lg:border-b-0">
        <div className="label heavy-divider pb-3 mb-4">Publishing settings</div>

        <div className="pt-4 mb-6">
          <label className="label">Your price</label>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceApt}
              onChange={(e) => setPriceApt(e.target.value)}
              className="display text-[36px] md:text-[42px] w-[100px] border-0 bg-transparent text-ink focus:outline-none"
            />
            <span className="text-[14px] text-muted font-medium">ShelbyUSD</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px]">Allow resale</span>
            <div
              className="toggle-track"
              data-on={allowResale}
              onClick={() => setAllowResale((v) => !v)}
            >
              <div className="toggle-knob" />
            </div>
          </div>
          <p className="mono text-[10px] text-muted leading-relaxed">
            Buyers can resell their access token. You earn a royalty on every resale automatically.
          </p>
          {allowResale && (
            <div className="flex items-center justify-between mt-3">
              <span className="label flex-1">Your royalty on resales</span>
              <input
                type="number"
                min="0"
                max="50"
                value={royaltyPct}
                onChange={(e) => setRoyaltyPct(e.target.value)}
                className="w-12 border-0 mono text-[14px] font-medium text-center bg-transparent"
              />
              <span className="text-[12px] text-muted ml-1">%</span>
            </div>
          )}
        </div>

        <div className="bg-hover p-4 mb-6">
          <div className="label mb-2">How it will appear</div>
          <div className="display text-[18px] mb-1">{title || 'Untitled'}</div>
          <div className="mono text-[10px] text-muted">{tab} — yours</div>
          <div className="display text-[26px] mt-2">{priceApt || '0'} ShelbyUSD</div>
        </div>

        {turnstileSiteKey && (
          <div className="mb-4" id="turnstile-anchor" data-sitekey={turnstileSiteKey} />
        )}

        <button onClick={submit} disabled={!!busy} className="btn-primary w-full">
          {busy ? 'Working…' : 'Publish'}
        </button>
        <div className="mono text-[10px] text-muted text-center mt-2 mb-1">
          Need test ShelbyUSD?{' '}
          <a href="/how-it-works#before-you-start" className="underline text-ink">
            How to fund your wallet
          </a>
        </div>
        <div className="mono text-[10px] text-muted text-center mt-2">
          Signs a transaction with your wallet — 1% protocol fee on sales
        </div>
      </div>
    </div>
  );
}
