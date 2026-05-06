import { IQuizSessionRepository } from '../repositories/IQuizSessionRepository';
import { IQuestionRepository } from '../repositories/IQuestionRepository';
import { calculateScore } from '../../shared/utils/scoreCalculator';
import { AppError } from '../../shared/errors/AppError';

export class SubmitAnswerUseCase {
  constructor(
    private sessionRepo: IQuizSessionRepository,
    private questionRepo: IQuestionRepository
  ) {}

  async execute(input: {
    sessionId: string;
    questionId: string;
    optionId: string;
    responseTimeMs: number;
  }): Promise<{
    correct: boolean;
    pointsEarned: number;
    totalScore: number;
  }> {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) throw new AppError('Sessão inválida.', 404);
    if (session.status !== 'in_progress') throw new AppError('Sessão já finalizada.', 400);

    if (session.answeredQuestionIds.includes(input.questionId)) {
      throw new AppError('Questão já respondida.', 409);
    }

    const questions = await this.questionRepo.findByQuizId(session.quizId);
    const question = questions.find(q => q.id === input.questionId);
    if (!question) throw new AppError('Questão não encontrada.', 404);

    const chosen = question.alternatives.find(a => a.id === input.optionId);
    if (!chosen) throw new AppError('Alternativa inválida.', 400);

    let pointsEarned = 0;
    if (chosen.isCorrect) {
      pointsEarned = calculateScore(
        question.weight,
        question.timeLimitSeconds,
        input.responseTimeMs
      );
    }

    session.totalScore += pointsEarned;
    session.answeredQuestionIds.push(input.questionId);
    await this.sessionRepo.update(session);

    return {
      correct: chosen.isCorrect,
      pointsEarned,
      totalScore: session.totalScore,
    };
  }
}