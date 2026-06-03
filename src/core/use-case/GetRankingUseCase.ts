import { prisma } from '../../infra/database/prisma.client';
import { AppError } from '../../shared/errors/AppError';

interface RankingEntry {
  userId: string;
  totalScore: number;
  totalTimeMs: number;
  position: number;
}

export class GetRankingUseCase {
  // Ranking geral — todas as sessões com rankingScope = "global"
  async executeGlobal(userId: string): Promise<{
    top10: RankingEntry[];
    userRank: RankingEntry | null;
  }> {
    return this.buildRanking({ rankingScope: 'global' }, userId);
  }

  // Ranking da empresa — sessões com rankingScope = "company" e companyQuizId vinculado
  async executeCompany(companyId: string, userId: string): Promise<{
    top10: RankingEntry[];
    userRank: RankingEntry | null;
  }> {
    // Busca IDs dos quizzes desta empresa
    const quizzes = await prisma.company_quiz.findMany({
      where: { companyId },
      select: { id: true },
    });
    const quizIds = quizzes.map((q: any) => q.id);
    if (!quizIds.length) return { top10: [], userRank: null };

    return this.buildRanking({
      rankingScope: 'company',
      companyQuizId: { in: quizIds },
    }, userId);
  }

  // Mantido para compatibilidade legada (quizId + userId)
  async execute(quizId: string, userId: string): Promise<{
    top10: RankingEntry[];
    userRank: RankingEntry | null;
  }> {
    return this.buildRanking({ quizId }, userId);
  }

  private async buildRanking(where: any, userId: string): Promise<{
    top10: RankingEntry[];
    userRank: RankingEntry | null;
  }> {
    const sessions = await prisma.quiz_session.findMany({
      where: { ...where, endTime: { not: null } },
    });

    if (!sessions.length) return { top10: [], userRank: null };

    const entries: RankingEntry[] = sessions.map((s: any) => ({
      userId: s.userId,
      totalScore: s.score ?? 0,
      totalTimeMs: s.endTime
        ? new Date(s.endTime).getTime() - new Date(s.startTime).getTime()
        : 0,
      position: 0,
    }));

    entries.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.totalTimeMs - b.totalTimeMs;
    });

    entries.forEach((e, i) => { e.position = i + 1; });

    const userRank = entries.find(e => e.userId === userId) ?? null;

    return { top10: entries.slice(0, 10), userRank };
  }
}
