import { aptos, CONTRACT_ADDRESS, aptToOctas } from './aptos';
import type { Content, ContentStatus, ContentType, PlatformConfig } from '@shared/types';

const TYPE_MAP: ContentType[] = ['article', 'video', 'course'];

interface RawContent {
  id: string | number;
  blob_id: string | number[];
  title: string | number[];
  creator: string;
  price: string | number;
  content_type: string | number;
  royalty_bps: string | number;
  allow_resale: boolean;
  upvotes: string | number;
  downvotes: string | number;
  total_sales: string | number;
  is_active: boolean;
  is_pending: boolean;
  is_flagged: boolean;
  submitted_at: string | number;
  approved_at: string | number;
}

function bytesToString(input: string | number[]): string {
  if (typeof input === 'string') {
    if (input.startsWith('0x')) {
      try {
        const hex = input.slice(2);
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
        return new TextDecoder().decode(bytes);
      } catch {
        return input;
      }
    }
    return input;
  }
  return new TextDecoder().decode(new Uint8Array(input));
}

function stringToBytes(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}

function statusOf(c: RawContent): ContentStatus {
  if (c.is_pending) return 'pending';
  if (c.is_flagged) return 'flagged';
  if (!c.is_active) return 'rejected';
  return 'live';
}

function epochToISO(seconds: string | number): string {
  const n = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (!n) return new Date(0).toISOString();
  return new Date(n * 1000).toISOString();
}

function mapContent(raw: RawContent): Content {
  return {
    id: typeof raw.id === 'string' ? parseInt(raw.id, 10) : raw.id,
    blobId: bytesToString(raw.blob_id),
    title: bytesToString(raw.title),
    description: '',
    creator: raw.creator,
    price: typeof raw.price === 'string' ? parseInt(raw.price, 10) : raw.price,
    contentType: TYPE_MAP[Number(raw.content_type)] ?? 'article',
    royaltyBps: Number(raw.royalty_bps),
    allowResale: !!raw.allow_resale,
    upvotes: Number(raw.upvotes),
    downvotes: Number(raw.downvotes),
    totalSales: Number(raw.total_sales),
    isActive: !!raw.is_active,
    isPending: !!raw.is_pending,
    isFlagged: !!raw.is_flagged,
    status: statusOf(raw),
    submittedAt: epochToISO(raw.submitted_at),
    approvedAt: raw.approved_at ? epochToISO(raw.approved_at) : undefined,
    publishedAt: epochToISO(raw.approved_at || raw.submitted_at),
  };
}

function ensureContractAddress(): string {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      'NEXT_PUBLIC_CONTRACT_ADDRESS is not set. Deploy contracts/sources/pulse_platform.move and set the address.',
    );
  }
  return CONTRACT_ADDRESS;
}

// ---------- View calls ----------

export async function fetchAllContent(): Promise<Content[]> {
  if (!CONTRACT_ADDRESS) return [];
  try {
    const result = await aptos.view<[RawContent[]]>({
      payload: { function: `${CONTRACT_ADDRESS}::platform::get_all_content`, functionArguments: [] },
    });
    return (result[0] ?? []).map(mapContent);
  } catch (err) {
    console.error('[pulse] fetchAllContent failed', err);
    return [];
  }
}

export async function fetchContent(id: number): Promise<Content | null> {
  if (!CONTRACT_ADDRESS) return null;
  try {
    const result = await aptos.view<[RawContent]>({
      payload: { function: `${CONTRACT_ADDRESS}::platform::get_content`, functionArguments: [id] },
    });
    return mapContent(result[0]);
  } catch {
    return null;
  }
}

export async function fetchContentCount(): Promise<number> {
  if (!CONTRACT_ADDRESS) return 0;
  try {
    const result = await aptos.view<[string]>({
      payload: { function: `${CONTRACT_ADDRESS}::platform::get_content_count`, functionArguments: [] },
    });
    return parseInt(result[0], 10);
  } catch {
    return 0;
  }
}

export async function checkAccess(buyer: string, contentId: number): Promise<boolean> {
  if (!CONTRACT_ADDRESS || !buyer) return false;
  try {
    const result = await aptos.view<[boolean]>({
      payload: { function: `${CONTRACT_ADDRESS}::platform::has_access`, functionArguments: [buyer, contentId] },
    });
    return !!result[0];
  } catch {
    return false;
  }
}

export async function checkBanned(wallet: string): Promise<boolean> {
  if (!CONTRACT_ADDRESS || !wallet) return false;
  try {
    const result = await aptos.view<[boolean]>({
      payload: { function: `${CONTRACT_ADDRESS}::platform::is_banned`, functionArguments: [wallet] },
    });
    return !!result[0];
  } catch {
    return false;
  }
}

export async function fetchPlatformConfig(): Promise<PlatformConfig | null> {
  if (!CONTRACT_ADDRESS) return null;
  try {
    const result = await aptos.view<
      [string, string, string, string, string, boolean, boolean, string, string, boolean]
    >({
      payload: { function: `${CONTRACT_ADDRESS}::platform::get_config`, functionArguments: [] },
    });
    const [admin, platformWallet, feeBps, voteCost, communityPool, requireAdminApproval, autoflagEnabled, pendingFeeBps, feeChangeAt, hasPendingFeeChange] = result;
    return {
      admin,
      platformWallet,
      feeBps: parseInt(feeBps, 10),
      voteCost: parseInt(voteCost, 10),
      communityPool: parseInt(communityPool, 10),
      requireAdminApproval,
      autoflagEnabled,
      pendingFeeBps: parseInt(pendingFeeBps, 10),
      feeChangeAt: parseInt(feeChangeAt, 10),
      hasPendingFeeChange,
    };
  } catch {
    return null;
  }
}

export async function fetchCredibilityScore(creator: string): Promise<number> {
  if (!CONTRACT_ADDRESS || !creator) return 50;
  try {
    const result = await aptos.view<[string]>({
      payload: { function: `${CONTRACT_ADDRESS}::platform::get_credibility_score`, functionArguments: [creator] },
    });
    return parseInt(result[0], 10);
  } catch {
    return 50;
  }
}

// ---------- Transaction payload builders (used client-side with wallet adapter) ----------

export function buildPublishTx(args: {
  blobId: string;
  title: string;
  priceApt: number;
  contentType: ContentType;
  royaltyBps: number;
  allowResale: boolean;
}) {
  ensureContractAddress();
  const typeIndex = TYPE_MAP.indexOf(args.contentType);
  return {
    data: {
      function: `${CONTRACT_ADDRESS}::platform::publish_content` as const,
      functionArguments: [
        stringToBytes(args.blobId),
        stringToBytes(args.title),
        aptToOctas(args.priceApt).toString(),
        typeIndex,
        args.royaltyBps,
        args.allowResale,
      ],
    },
  };
}

export function buildPurchaseTx(contentId: number) {
  ensureContractAddress();
  return {
    data: {
      function: `${CONTRACT_ADDRESS}::platform::purchase_access` as const,
      functionArguments: [contentId],
    },
  };
}

export function buildVoteTx(contentId: number, isUpvote: boolean) {
  ensureContractAddress();
  return {
    data: {
      function: `${CONTRACT_ADDRESS}::platform::cast_vote` as const,
      functionArguments: [contentId, isUpvote],
    },
  };
}

export function buildAcceptResaleTx(seller: string, contentId: number, salePriceApt: number) {
  ensureContractAddress();
  return {
    data: {
      function: `${CONTRACT_ADDRESS}::platform::accept_resale` as const,
      functionArguments: [seller, contentId, aptToOctas(salePriceApt).toString()],
    },
  };
}

export function buildSetContentActiveTx(contentId: number, isActive: boolean) {
  ensureContractAddress();
  return {
    data: {
      function: `${CONTRACT_ADDRESS}::platform::set_content_active` as const,
      functionArguments: [contentId, isActive],
    },
  };
}

export function buildBanWalletTx(wallet: string) {
  ensureContractAddress();
  return {
    data: { function: `${CONTRACT_ADDRESS}::platform::ban_wallet` as const, functionArguments: [wallet] },
  };
}

export function buildProposeFeeChangeTx(newFeeBps: number) {
  ensureContractAddress();
  return {
    data: { function: `${CONTRACT_ADDRESS}::platform::propose_fee_change` as const, functionArguments: [newFeeBps] },
  };
}

export function buildExecuteFeeChangeTx() {
  ensureContractAddress();
  return {
    data: { function: `${CONTRACT_ADDRESS}::platform::execute_fee_change` as const, functionArguments: [] },
  };
}

export function buildSetVoteCostTx(newCostOctas: number) {
  ensureContractAddress();
  return {
    data: { function: `${CONTRACT_ADDRESS}::platform::set_vote_cost` as const, functionArguments: [newCostOctas] },
  };
}

export function buildSetAutoflagTx(enabled: boolean) {
  ensureContractAddress();
  return {
    data: { function: `${CONTRACT_ADDRESS}::platform::set_autoflag` as const, functionArguments: [enabled] },
  };
}
