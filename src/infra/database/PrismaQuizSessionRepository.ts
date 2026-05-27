// src/infra/database/PrismaQuizSessionRepository.ts
import { prisma } from './prisma.client';
import { IQuizSessionRepository } from '../../core/repositories/IQuizSessionRepository';
import { QuizSession } from '../../core/entities/QuizSession';

export class PrismaQuizSessionRepository implements IQuizSessionRepository {
  async create(session: QuizSession): Promise<QuizSession> {
    const created = await prisma.quiz_session.create({
      data: {
        id: session.id,
        quizId: session.quizId,
        userId: session.userId,
        startTime: session.startedAt,
        endTime: session.status === 'completo' ? new Date() : null,
        score: session.totalScore
      }
    });

    return { ...session, startedAt: created.startTime };
  }

  async findById(id: string): Promise<QuizSession | null> {
    // No Prisma 7, o 'include' otimiza o join automaticamente de forma nativa
    const session = await prisma.quiz_session.findUnique({
      where: { id },
      include: {
        answers: true // Busca as perguntas que já foram respondidas nesta sessão
      }
    });

    if (!session) return null;

    return {
      id: session.id,
      quizId: session.quizId,
      userId: session.userId,
      startedAt: session.startTime,
      completedAt: session.endTime || undefined,
      status: session.endTime ? 'completo' : 'Em_progresso',
      totalScore: session.score || 0,
      // Extrai os IDs das perguntas já respondidas vindas da tabela pivot
      answeredQuestionIds: session.answers.map(ans => ans.questionId)
    } as QuizSession;
  }

  async update(session: QuizSession): Promise<QuizSession> {
    const updated = await prisma.quiz_session.update({
      where: { id: session.id },
      data: {
        quizId: session.quizId,
        userId: session.userId,
        startTime: session.startedAt,
        endTime: session.status === 'completo' ? new Date() : null,
        score: session.totalScore
      }
    });

    return { ...session, startedAt: updated.startTime };
  }

  async findByQuizId(quizId: string): Promise<QuizSession[]> {
    const sessions = await prisma.quiz_session.findMany({
      where: { quizId },
      include: { answers: true }
    });

    return sessions.map(session => ({
      id: session.id,
      quizId: session.quizId,
      userId: session.userId,
      startedAt: session.startTime,
      completedAt: session.endTime || undefined,
      status: session.endTime ? 'completo' : 'Em_progresso',
      totalScore: session.score || 0,
      answeredQuestionIds: session.answers.map(ans => ans.questionId)
    })) as QuizSession[];
  }
}