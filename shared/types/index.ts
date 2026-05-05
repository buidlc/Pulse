export type ContentType = 'article' | 'video' | 'course';
export type ContentStatus = 'pending' | 'live' | 'flagged' | 'rejected';
export type UserRole = 'visitor' | 'user' | 'admin';
export type VoteType = 'upvote' | 'downvote';
export type ActivityType = 'sale' | 'resale_royalty';

export interface Content {
  id: number;
  blobId: string;
  title: string;
  description: string;
  creator: string;
  price: number;
  contentType: ContentType;
  royaltyBps: number;
  allowResale: boolean;
  upvotes: number;
  downvotes: number;
  totalSales: number;
  status: ContentStatus;
  isActive: boolean;
  isPending: boolean;
  isFlagged: boolean;
  publishedAt: string;
  submittedAt: string;
  approvedAt?: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  contentId: number;
  title: string;
  blobId: string;
  order: number;
}

export interface Review {
  buyerAddress: string;
  contentId: number;
  voteType: VoteType;
  reviewText: string;
  txHash: string;
  timestamp: string;
}

export interface Creator {
  address: string;
  totalSales: number;
  totalEarned: number;
  royaltiesEarned: number;
  credibilityScore: number;
  memberSinceDays: number;
  contentCount: number;
  isBanned: boolean;
}

export interface ActivityItem {
  type: ActivityType;
  contentId: number;
  contentTitle: string;
  amount: number;
  buyerAddress: string;
  txHash: string;
  timestamp: string;
}

export interface PlatformStats {
  totalContent: number;
  totalSales: number;
  totalFeesCollected: number;
  totalVoteTxs: number;
  flaggedCount: number;
  pendingCount: number;
}

export interface JWTPayload {
  wallet: string;
  role: UserRole;
  exp: number;
  iat: number;
  jti: string;
}

export interface PlatformConfig {
  admin: string;
  platformWallet: string;
  feeBps: number;
  voteCost: number;
  communityPool: number;
  requireAdminApproval: boolean;
  autoflagEnabled: boolean;
  pendingFeeBps: number;
  feeChangeAt: number;
  hasPendingFeeChange: boolean;
}
