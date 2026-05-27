// src/infra/database/PrismaQuestionRepository.ts
import { prisma } from './prisma.client';
import { IQuestionRepository } from '../../core/repositories/IQuestionRepository';
import { Question } from '../../core/entities/Question';

export class PrismaQuestionRepository implements IQuestionRepository {
  async findByQuizId(quizId: string): Promise<Question[]> {
    const questions = await prisma.question.findMany({
      where: { quizId },
      include: {
        alternatives: true
      }
    });

    // Converter o formato do Prisma para sua entidade Question
    return questions.map(q => ({
      id: q.id,
      text: q.text,
      weight: q.weight,
      timeLimitSeconds: q.timeLimitSeconds,
      alternatives: q.alternatives.map(alt => ({
        id: alt.id,
        text: alt.text,
        isCorrect: alt.isCorrect
      }))
    }));
  }
}