import { prisma } from './prisma.client';
import { IQuestionRepository, CreateQuestionDTO, QuestionFilters } from '../../core/repositories/IQuestionRepository';
import { Question } from '../../core/entities/Question';

function mapQuestion(q: any): Question {
  return {
    id: q.id,
    text: q.text,
    weight: q.weight,
    timeLimitSeconds: q.timeLimitSeconds,
    alternatives: q.alternatives.map((alt: any) => ({
      id: alt.id,
      text: alt.text,
      isCorrect: alt.isCorrect,
    })),
  };
}

export class PrismaQuestionRepository implements IQuestionRepository {

  // Mantido para compatibilidade com o fluxo legado
  async findByQuizId(quizId: string): Promise<Question[]> {
    const questions = await prisma.question.findMany({
      where: { quizId, source: 'platform' },
      include: { alternatives: true },
    });
    return questions.map(mapQuestion);
  }

  // Banco global — com filtro opcional de categoria e limite
  async findGlobal(filters?: QuestionFilters): Promise<Question[]> {
    const where: any = { source: 'platform' };
    if (filters?.category) where.category = filters.category;

    const questions = await prisma.question.findMany({
      where,
      include: { alternatives: true },
    });

    // Embaralha antes de aplicar limite
    const shuffled = this.shuffle(questions);
    const limited = filters?.limit ? shuffled.slice(0, filters.limit) : shuffled;
    return limited.map(mapQuestion);
  }

  // Perguntas da empresa
  async findByCompany(companyId: string): Promise<Question[]> {
    const questions = await prisma.question.findMany({
      where: { source: 'company', companyId },
      include: { alternatives: true },
    });
    return questions.map(mapQuestion);
  }

  // Perguntas por IDs específicos (quiz personalizado da empresa)
  async findByIds(ids: string[]): Promise<Question[]> {
    const questions = await prisma.question.findMany({
      where: { id: { in: ids } },
      include: { alternatives: true },
    });
    return questions.map(mapQuestion);
  }

  async findAll(): Promise<Question[]> {
    const questions = await prisma.question.findMany({
      include: { alternatives: true },
    });
    return questions.map(mapQuestion);
  }

  async create(data: CreateQuestionDTO): Promise<Question> {
    const question = await prisma.question.create({
      data: {
        text: data.text,
        weight: data.weight,
        timeLimitSeconds: data.timeLimitSeconds,
        quizId: data.quizId,
        source: data.source ?? 'platform',
        category: data.category ?? null,
        companyId: data.companyId ?? null,
        alternatives: {
          create: data.alternatives.map(alt => ({
            text: alt.text,
            isCorrect: alt.isCorrect,
          })),
        },
      },
      include: { alternatives: true },
    });
    return mapQuestion(question);
  }

  async delete(id: string): Promise<void> {
    await prisma.alternative.deleteMany({ where: { questionId: id } });
    await prisma.question.delete({ where: { id } });
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
