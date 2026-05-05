export function calculateCredibilityScore(
  upvotes: number,
  downvotes: number,
  totalSales: number,
  memberSinceDays: number,
): number {
  const totalVotes = upvotes + downvotes;
  const upvoteRatio = totalVotes > 0 ? upvotes / totalVotes : 0.5;
  const salesScore = Math.min(totalSales / 100, 1);
  const tenureScore = Math.min(memberSinceDays / 365, 1);
  const score = upvoteRatio * 0.5 + salesScore * 0.3 + tenureScore * 0.2;
  return Math.round(score * 100);
}
