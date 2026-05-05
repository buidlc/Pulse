import type { Content } from '@shared/types';

// Sample content shown ONLY when the on-chain ledger is empty. Once any real
// piece is published and approved, both the home page and /ledger swap to
// live data and the preview banner disappears.
export const PREVIEW_CONTENT: Content[] = [
  {
    id: 9001, blobId: 'preview-1',
    title: 'Building a Move smart contract: lessons from six months on Aptos',
    description: '', creator: '0xa3f2c7d4e1b88a52f9c1d4e7b8a31f5c9e2d6b4a7c1e8f3d5b9a2c6e4f8d1a3b',
    price: 50_000_000, contentType: 'article', royaltyBps: 1000, allowResale: true,
    upvotes: 24, downvotes: 1, totalSales: 47, status: 'live',
    isActive: true, isPending: false, isFlagged: false,
    publishedAt: '2026-04-15T00:00:00.000Z', submittedAt: '2026-04-15T00:00:00.000Z',
    approvedAt: '2026-04-15T00:00:00.000Z',
  },
  {
    id: 9002, blobId: 'preview-2',
    title: 'How I sold $4k of writing in my first week as a wallet-native creator',
    description: '', creator: '0xb7c4e2a1f3d6c8b5a2e9f1c4d7b3a6e8c2f5b9d4a7c1e3f6b8a5d2c9e4f7b1a3',
    price: 80_000_000, contentType: 'article', royaltyBps: 1500, allowResale: true,
    upvotes: 18, downvotes: 0, totalSales: 31, status: 'live',
    isActive: true, isPending: false, isFlagged: false,
    publishedAt: '2026-04-22T00:00:00.000Z', submittedAt: '2026-04-22T00:00:00.000Z',
    approvedAt: '2026-04-22T00:00:00.000Z',
  },
  {
    id: 9003, blobId: 'preview-3',
    title: 'DeFi yield strategies that actually compound — a six-lesson course',
    description: '', creator: '0xc1d8a4e7f2b6c9d3e5a8f1b4c7d2e6a9f3b5c8d1e4f7a2b6c9d3e5f8a1b4c7d2',
    price: 250_000_000, contentType: 'course', royaltyBps: 2000, allowResale: true,
    upvotes: 31, downvotes: 2, totalSales: 19, status: 'live',
    isActive: true, isPending: false, isFlagged: false,
    publishedAt: '2026-04-08T00:00:00.000Z', submittedAt: '2026-04-08T00:00:00.000Z',
    approvedAt: '2026-04-08T00:00:00.000Z',
  },
  {
    id: 9004, blobId: 'preview-4',
    title: 'Petra wallet from zero — a 12-minute video walkthrough',
    description: '', creator: '0xd4e7b1a8f3c6d9b2e5a8f1c4d7b3e6a9f2c5b8d1e4f7a3b6c9d2e5f8a1b4c7d3',
    price: 30_000_000, contentType: 'video', royaltyBps: 500, allowResale: false,
    upvotes: 12, downvotes: 1, totalSales: 28, status: 'live',
    isActive: true, isPending: false, isFlagged: false,
    publishedAt: '2026-04-28T00:00:00.000Z', submittedAt: '2026-04-28T00:00:00.000Z',
    approvedAt: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 9005, blobId: 'preview-5',
    title: 'The case for storing your audience on-chain',
    description: '', creator: '0xe2f5b8a1c4d7e3b6a9f2c5b8d1e4f7a3b6c9d2e5f8a1b4c7d3e6a9f2c5b8d1e4',
    price: 40_000_000, contentType: 'article', royaltyBps: 1000, allowResale: true,
    upvotes: 9, downvotes: 0, totalSales: 14, status: 'live',
    isActive: true, isPending: false, isFlagged: false,
    publishedAt: '2026-05-01T00:00:00.000Z', submittedAt: '2026-05-01T00:00:00.000Z',
    approvedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 9006, blobId: 'preview-6',
    title: 'Aptos transaction lifecycle, explained with pictures',
    description: '', creator: '0xf3a6c9d2e5b8a1c4d7f2b5e8a1c4d7b3e6a9f2c5b8d1e4f7a3b6c9d2e5f8a1b4',
    price: 20_000_000, contentType: 'article', royaltyBps: 800, allowResale: true,
    upvotes: 22, downvotes: 0, totalSales: 38, status: 'live',
    isActive: true, isPending: false, isFlagged: false,
    publishedAt: '2026-04-19T00:00:00.000Z', submittedAt: '2026-04-19T00:00:00.000Z',
    approvedAt: '2026-04-19T00:00:00.000Z',
  },
  {
    id: 9007, blobId: 'preview-7',
    title: 'Shelby blob storage in production: a week-by-week journal',
    description: '', creator: '0xa1b4c7d2e5f8a1b4c7d3e6a9f2c5b8d1e4f7a3b6c9d2e5f8a1b4c7d3e6a9f2c5',
    price: 60_000_000, contentType: 'article', royaltyBps: 1200, allowResale: true,
    upvotes: 16, downvotes: 1, totalSales: 22, status: 'live',
    isActive: true, isPending: false, isFlagged: false,
    publishedAt: '2026-04-12T00:00:00.000Z', submittedAt: '2026-04-12T00:00:00.000Z',
    approvedAt: '2026-04-12T00:00:00.000Z',
  },
  {
    id: 9008, blobId: 'preview-8',
    title: 'Ed25519 signatures for web devs — the practical version',
    description: '', creator: '0xb4c7d3e6a9f2c5b8d1e4f7a3b6c9d2e5f8a1b4c7d3e6a9f2c5b8d1e4f7a3b6c9',
    price: 35_000_000, contentType: 'video', royaltyBps: 1000, allowResale: true,
    upvotes: 14, downvotes: 0, totalSales: 17, status: 'live',
    isActive: true, isPending: false, isFlagged: false,
    publishedAt: '2026-04-25T00:00:00.000Z', submittedAt: '2026-04-25T00:00:00.000Z',
    approvedAt: '2026-04-25T00:00:00.000Z',
  },
  {
    id: 9009, blobId: 'preview-9',
    title: 'Wallet-gated newsletters: a step-by-step playbook',
    description: '', creator: '0xc7d3e6a9f2c5b8d1e4f7a3b6c9d2e5f8a1b4c7d3e6a9f2c5b8d1e4f7a3b6c9d2',
    price: 100_000_000, contentType: 'course', royaltyBps: 1800, allowResale: true,
    upvotes: 19, downvotes: 1, totalSales: 11, status: 'live',
    isActive: true, isPending: false, isFlagged: false,
    publishedAt: '2026-04-05T00:00:00.000Z', submittedAt: '2026-04-05T00:00:00.000Z',
    approvedAt: '2026-04-05T00:00:00.000Z',
  },
  {
    id: 9010, blobId: 'preview-10',
    title: 'Why royalty splits beat platform takes — a math walkthrough',
    description: '', creator: '0xd3e6a9f2c5b8d1e4f7a3b6c9d2e5f8a1b4c7d3e6a9f2c5b8d1e4f7a3b6c9d2e5',
    price: 45_000_000, contentType: 'article', royaltyBps: 1500, allowResale: true,
    upvotes: 27, downvotes: 2, totalSales: 33, status: 'live',
    isActive: true, isPending: false, isFlagged: false,
    publishedAt: '2026-04-30T00:00:00.000Z', submittedAt: '2026-04-30T00:00:00.000Z',
    approvedAt: '2026-04-30T00:00:00.000Z',
  },
];

export const PREVIEW_STATS = {
  pieces: 142,
  sales: 487,
  earningsApt: 23.6,
  upvotes: 489,
};

export const PREVIEW_BANNER_LONG =
  'Preview · Sample data shown until creators publish — every number on this page becomes live the moment a piece is sold';
export const PREVIEW_BANNER_SHORT =
  'Preview · Sample data until creators publish';
