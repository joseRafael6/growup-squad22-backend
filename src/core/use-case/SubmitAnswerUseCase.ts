import { IQuizSessionRepository } from '../repositories/IQuizSessionRepository';
import { IQuestionRepository } from '../repositories/IQuestionRepository';
import { calculateScore } from '../../shared/utils/scoreCalculator';
import { AppError } from '../../shared/errors/AppError';
import prisma from '../../infra/database/prisma.client';

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
    if (session.status === 'completo') throw new AppError('Sessão já finalizada.', 400);

    if (session.answeredQuestionIds.includes(input.questionId)) {
      throw new AppError('Questão já respondida.', 409);
    }

    // Busca a questão diretamente pelo ID, independente do quizId
    const question = await prisma.question.findUnique({
      where: { id: input.questionId },
      include: { alternatives: true },
    });
    if (!question) throw new AppError('Questão não encontrada.', 404);

    const chosen = question.alternatives.find((a: any) => a.id === input.optionId);
    if (!chosen) throw new AppError('Alternativa inválida.', 400);

    let pointsEarned = 0;
    if (chosen.isCorrect) {
      pointsEarned = calculateScore(
        question.weight,
        question.timeLimitSeconds,
        input.responseTimeMs
      );
    }

    // Persiste a resposta
    await prisma.quiz_session_question.create({
      data: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        alternativeId: input.optionId,
        isCorrect: chosen.isCorrect,
      }
    });

    // Atualiza a sessão
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