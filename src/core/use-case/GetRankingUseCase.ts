// src/core/use-cases/GetRankingUseCase.ts
import { IQuizSessionRepository } from '../repositories/IQuizSessionRepository';
import { AppError } from '../../shared/errors/AppError';

interface RankingEntry {
  userId: string;
  totalScore: number;
  totalTimeMs: number;
  position: number;
}

export class GetRankingUseCase {
  constructor(private sessionRepo: IQuizSessionRepository) {}

  async execute(quizId: string, userId: string): Promise<{
    top10: RankingEntry[];
    userRank: RankingEntry | null;
  }> {
    // 1. Busca todas as sessões do quiz
    const sessions = await this.sessionRepo.findByQuizId(quizId);
    
    // 2. Filtra apenas sessões completadas
    const completedSessions = sessions.filter(
      s => s.status === 'completed' && s.completedAt
    );

    if (completedSessions.length === 0) {
      return { top10: [], userRank: null };
    }

    // 3. Calcula tempo total e monta entries
    const entries: RankingEntry[] = completedSessions.map(session => {
      const started = session.startedAt.getTime();
      const completed = session.completedAt!.getTime();
      const totalTimeMs = completed - started;

      return {
        userId: session.userId,
        totalScore: session.totalScore,
        totalTimeMs,
        position: 0,
      };
    });

    // 4. Ordena: maior pontuação → menor tempo (critério de desempate)
    entries.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore; // decrescente
      }
      return a.totalTimeMs - b.totalTimeMs; // crescente (menor tempo ganha)
    });

    // 5. Atribui posições 
    entries.forEach((entry, index) => {
      entry.position = index + 1;
    });

    // 6. Encontra o usuário solicitado
    const userEntry = entries.find(e => e.userId === userId) || null;

    // 7. Retorna top10 e a posição do usuário
    return {
      top10: entries.slice(0, 10),
      userRank: userEntry,
    };
  }
}