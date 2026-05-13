// src/infra/http/view-models/RankingViewModel.ts
export class RankingViewModel {
  static toHTTP(entry: {
    userId: string;
    totalScore: number;
    totalTimeMs: number;
    position: number;
  }) {
    return {
      userId: entry.userId,
      score: entry.totalScore,
      timeSeconds: (entry.totalTimeMs / 1000).toFixed(1),
      position: entry.position,
    };
  }
}