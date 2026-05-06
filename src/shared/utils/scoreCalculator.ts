export function calculateScore(
  weight: number,
  timeLimitSeconds: number,
  responseTimeMs: number
): number {
  const responseSeconds = responseTimeMs / 1000;
  const timeRatio = Math.min(responseSeconds / timeLimitSeconds, 1.5);
  const multiplier = Math.max(0.2, 1.5 - timeRatio);
  return Math.round(weight * multiplier);
}