/**
 * Use cases para gerenciar perguntas de uma empresa específica.
 * Perguntas da empresa têm source = "company" e companyId preenchido.
 * Perguntas da plataforma têm source = "platform" e companyId = null.
 */
import { IAdminQuestionRepository } from '../../repositories/IAdminQuestionRepository';
import { ICompanyRepository } from '../../repositories/ICompanyRepository';
import { Question } from '../../entities/Question';
import { prisma } from '../../../infra/database/prisma.client';

export class CompanyQuestionUseCase {
  constructor(
    private questionRepo: IAdminQuestionRepository,
    private companyRepo: ICompanyRepository,
  ) {}

  /** Lista perguntas conforme o questionSource da empresa */
  async listForCompany(companyId: string, quizId?: string): Promise<Question[]> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) throw new Error('Empresa não encontrada');

    const where: any = {};
    if (quizId) where.quizId = quizId;

    if (company.questionSource === 'platform') {
      where.source = 'platform';
    } else if (company.questionSource === 'company') {
      where.source = 'company';
      where.companyId = companyId;
    } else {
      // "both": plataforma OU as da própria empresa
      where.OR = [
        { source: 'platform' },
        { source: 'company', companyId },
      ];
    }

    const questions = await prisma.question.findMany({
      where,
      include: { alternatives: true },
    });

    return questions.map((q: any) => ({
      id: q.id,
      text: q.text,
      weight: q.weight,
      timeLimitSeconds: q.timeLimitSeconds,
      alternatives: q.alternatives.map((a: any) => ({
        id: a.id,
        text: a.text,
        isCorrect: a.isCorrect,
      })),
    }));
  }

  /** Cria uma pergunta vinculada à empresa */
  async createForCompany(
    companyId: string,
    data: Omit<Question, 'id'> & { quizId: string }
  ): Promise<Question> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) throw new Error('Empresa não encontrada');

    const created = await prisma.question.create({
      data: {
        text: data.text,
        weight: data.weight,
        timeLimitSeconds: data.timeLimitSeconds,
        quizId: data.quizId,
        source: 'company',
        companyId,
        alternatives: {
          create: data.alternatives.map(alt => ({
            text: alt.text,
            isCorrect: alt.isCorrect,
          })),
        },
      },
      include: { alternatives: true },
    });

    return {
      id: created.id,
      text: created.text,
      weight: created.weight,
      timeLimitSeconds: created.timeLimitSeconds,
      alternatives: created.alternatives.map((a: any) => ({
        id: a.id,
        text: a.text,
        isCorrect: a.isCorrect,
      })),
    };
  }

  /** Edita uma pergunta da empresa (só pode editar as próprias) */
  async updateForCompany(
    companyId: string,
    questionId: string,
    data: { text?: string; weight?: number; timeLimitSeconds?: number; alternatives?: Array<{ text: string; isCorrect: boolean }> }
  ): Promise<Question> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { alternatives: true },
    });

    if (!question) throw new Error('Pergunta não encontrada');
    if (question.companyId !== companyId) {
      throw new Error('Você só pode editar perguntas criadas pela sua empresa');
    }

    // Atualiza campos básicos
    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        text: data.text,
        weight: data.weight,
        timeLimitSeconds: data.timeLimitSeconds,
      },
      include: { alternatives: true },
    });

    // Se enviou novas alternativas, substitui todas
    if (data.alternatives && data.alternatives.length >= 2) {
      await prisma.alternative.deleteMany({ where: { questionId } });
      await prisma.alternative.createMany({
        data: data.alternatives.map(alt => ({
          text: alt.text,
          isCorrect: alt.isCorrect,
          questionId,
        })),
      });
    }

    // Retorna pergunta atualizada
    const final = await prisma.question.findUnique({
      where: { id: questionId },
      include: { alternatives: true },
    });

    return {
      id: final!.id,
      text: final!.text,
      weight: final!.weight,
      timeLimitSeconds: final!.timeLimitSeconds,
      alternatives: final!.alternatives.map((a: any) => ({
        id: a.id,
        text: a.text,
        isCorrect: a.isCorrect,
      })),
    };
  }

  /** Deleta uma pergunta da empresa (só pode deletar as próprias) */
  async deleteForCompany(companyId: string, questionId: string): Promise<void> {
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new Error('Pergunta não encontrada');
    if (question.companyId !== companyId) {
      throw new Error('Você só pode deletar perguntas criadas pela sua empresa');
    }
    await prisma.alternative.deleteMany({ where: { questionId } });
    await prisma.question.delete({ where: { id: questionId } });
  }
}
