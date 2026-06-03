import { prisma } from "./prisma.client";
import { IAdminQuestionRepository } from "../../core/repositories/IAdminQuestionRepository";
import { Question } from "../../core/entities/Question";

export class PrismaAdminQuestionRepository implements IAdminQuestionRepository {
  async findAll(): Promise<Question[]> {
    const questions = await prisma.question.findMany({
      include: { alternatives: true },
    });
    return questions.map(this.toEntity);
  }

  async findById(id: string): Promise<Question | null> {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { alternatives: true },
    });
    return question ? this.toEntity(question) : null;
  }

  async create(data: Omit<Question, "id"> & { quizId: string }): Promise<Question> {
    const created = await prisma.question.create({
      data: {
        text: data.text,
        weight: data.weight,
        timeLimitSeconds: data.timeLimitSeconds,
        quizId: data.quizId,
        alternatives: {
          create: data.alternatives.map(alt => ({
            text: alt.text,
            isCorrect: alt.isCorrect,
          })),
        },
      },
      include: { alternatives: true },
    });
    return this.toEntity(created);
  }

  async update(id: string, data: Partial<Omit<Question, "id">>): Promise<Question> {
    // Atualiza campos da pergunta
    const updated = await prisma.question.update({
      where: { id },
      data: {
        text: data.text,
        weight: data.weight,
        timeLimitSeconds: data.timeLimitSeconds,
      },
      include: { alternatives: true },
    });
    // (Opcional) Para atualizar alternativas, você precisaria de lógica adicional
    // removendo as antigas e criando novas. Vou omitir por brevidade, mas pode ser adicionado.
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.alternative.deleteMany({ where: { questionId: id } });
    await prisma.question.delete({ where: { id } });
  }

  private toEntity(record: any): Question {
    return {
      id: record.id,
      text: record.text,
      weight: record.weight,
      timeLimitSeconds: record.timeLimitSeconds,
      alternatives: record.alternatives.map((alt: any) => ({
        id: alt.id,
        text: alt.text,
        isCorrect: alt.isCorrect,
      })),
    };
  }
}