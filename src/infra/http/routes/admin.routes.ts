import { FastifyInstance } from 'fastify';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { PrismaQuestionRepository } from '../../database/PrismaQuestionRepository';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminMiddleware);

  const questionRepo = new PrismaQuestionRepository();

  // Lista todas as perguntas do banco global
  app.get('/admin/questions', async (request, reply) => {
    try {
      const { category } = request.query as { category?: string };
      const questions = category
        ? await questionRepo.findGlobal({ category })
        : await questionRepo.findGlobal();
      return reply.send(questions);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Cria pergunta no banco global — aceita campo category
  app.post('/admin/questions', async (request, reply) => {
    try {
      const data = request.body as any;

      if (!data.text || !data.alternatives?.length) {
        return reply.status(400).send({ error: 'text e alternatives são obrigatórios' });
      }

      const question = await questionRepo.create({
        text: data.text,
        weight: data.weight ?? 10,
        timeLimitSeconds: data.timeLimitSeconds ?? 30,
        quizId: data.quizId ?? 'global',
        source: 'platform',           // sempre platform para o banco global
        category: data.category ?? null,
        alternatives: data.alternatives,
      });

      return reply.status(201).send(question);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Edita pergunta do banco global (texto, peso, tempo, categoria, alternativas)
  app.put('/admin/questions/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const { prisma } = await import('../../database/prisma.client');

      await prisma.question.update({
        where: { id },
        data: {
          text: data.text,
          weight: data.weight,
          timeLimitSeconds: data.timeLimitSeconds,
          category: data.category ?? null,
        },
      });

      if (data.alternatives?.length >= 2) {
        await prisma.alternative.deleteMany({ where: { questionId: id } });
        await prisma.alternative.createMany({
          data: data.alternatives.map((a: any) => ({
            text: a.text,
            isCorrect: a.isCorrect,
            questionId: id,
          })),
        });
      }

      const updated = await questionRepo.findByIds([id]);
      return reply.send(updated[0] ?? { message: 'Atualizado' });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Deleta pergunta do banco global
  app.delete('/admin/questions/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await questionRepo.delete(id);
      return reply.send({ message: 'Pergunta deletada com sucesso' });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Lista categorias disponíveis no banco global
  app.get('/admin/categories', async (_request, reply) => {
    try {
      const { prisma } = await import('../../database/prisma.client');
      const categories = await prisma.question.findMany({
        where: { source: 'platform', category: { not: null } },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });
      return reply.send(categories.map((c: any) => c.category).filter(Boolean));
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
