/**
 * Rotas para gerenciar quizzes criados pelos admins das empresas.
 * Separado do company.routes.ts para manter organização.
 */
import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.middleware';
import { prisma } from '../../database/prisma.client';
import { SupabaseUserRepository } from '../../database/SupabaseUserRepository';

const userRepo = new SupabaseUserRepository();

async function resolveUserId(request: any): Promise<string> {
  const clerkId = request.user?.sub;
  const user = await userRepo.findByClerkId(clerkId);
  if (!user) throw new Error('Usuário não encontrado. Sincronize primeiro.');
  return user.id;
}

async function assertCompanyAdmin(companyId: string, userId: string): Promise<void> {
  const record = await prisma.company_admin.findFirst({ where: { companyId, userId } });
  if (!record) throw new Error('Acesso negado. Você não é admin desta empresa.');
}

export async function companyQuizRoutes(app: FastifyInstance) {

  // ── Listar quizzes da empresa ────────────────────────────────────────────
  app.get('/companies/:companyId/quizzes', { preHandler: authMiddleware }, async (req, reply) => {
    try {
      const { companyId } = req.params as any;
      const quizzes = await prisma.company_quiz.findMany({
        where: { companyId },
        include: { questions: { include: { question: { select: { id: true, text: true, category: true, source: true } } } } },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send(quizzes.map((q: any) => ({
        id: q.id,
        name: q.name,
        description: q.description,
        questionCount: q.questions.length,
        questions: q.questions.map((cqq: any) => cqq.question),
        createdAt: q.createdAt,
      })));
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // ── Criar quiz da empresa ────────────────────────────────────────────────
  // Body: { name, description?, questionIds: string[] }
  // questionIds pode ser mix de perguntas da empresa + do banco global
  app.post('/companies/:companyId/quizzes', { preHandler: authMiddleware }, async (req, reply) => {
    try {
      const { companyId } = req.params as any;
      const userId = await resolveUserId(req);
      await assertCompanyAdmin(companyId, userId);

      const { name, description, questionIds } = req.body as any;

      if (!name?.trim()) return reply.status(400).send({ error: 'Nome do quiz é obrigatório' });
      if (!questionIds?.length || questionIds.length < 10) {
        return reply.status(400).send({ error: 'O quiz precisa de no mínimo 10 perguntas' });
      }

      // Valida que as perguntas existem e pertencem ao banco global ou à empresa
      const questions = await prisma.question.findMany({
        where: {
          id: { in: questionIds },
          OR: [
            { source: 'platform' },
            { source: 'company', companyId },
          ],
        },
        select: { id: true },
      });

      if (questions.length !== questionIds.length) {
        return reply.status(400).send({
          error: 'Algumas perguntas não foram encontradas ou não pertencem ao banco global nem à sua empresa.',
        });
      }

      const quiz = await prisma.company_quiz.create({
        data: {
          companyId,
          name: name.trim(),
          description: description?.trim() ?? null,
          questions: {
            create: questionIds.map((qId: string) => ({ questionId: qId })),
          },
        },
        include: { questions: true },
      });

      return reply.status(201).send({
        id: quiz.id,
        name: quiz.name,
        description: quiz.description,
        questionCount: quiz.questions.length,
      });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // ── Atualizar quiz (nome, descrição, perguntas) ───────────────────────────
  app.put('/companies/:companyId/quizzes/:quizId', { preHandler: authMiddleware }, async (req, reply) => {
    try {
      const { companyId, quizId } = req.params as any;
      const userId = await resolveUserId(req);
      await assertCompanyAdmin(companyId, userId);

      const { name, description, questionIds } = req.body as any;

      if (questionIds && questionIds.length < 10) {
        return reply.status(400).send({ error: 'O quiz precisa de no mínimo 10 perguntas' });
      }

      // Atualiza dados básicos
      await prisma.company_quiz.update({
        where: { id: quizId },
        data: {
          name: name?.trim(),
          description: description?.trim() ?? undefined,
        },
      });

      // Se enviou novas perguntas, substitui
      if (questionIds?.length) {
        await prisma.company_quiz_question.deleteMany({ where: { companyQuizId: quizId } });
        await prisma.company_quiz_question.createMany({
          data: questionIds.map((qId: string) => ({ companyQuizId: quizId, questionId: qId })),
        });
      }

      return reply.send({ message: 'Quiz atualizado com sucesso' });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // ── Deletar quiz ──────────────────────────────────────────────────────────
  app.delete('/companies/:companyId/quizzes/:quizId', { preHandler: authMiddleware }, async (req, reply) => {
    try {
      const { companyId, quizId } = req.params as any;
      const userId = await resolveUserId(req);
      await assertCompanyAdmin(companyId, userId);

      await prisma.company_quiz_question.deleteMany({ where: { companyQuizId: quizId } });
      await prisma.company_quiz.delete({ where: { id: quizId } });
      return reply.send({ message: 'Quiz deletado com sucesso' });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // ── Listar categorias disponíveis no banco global ─────────────────────────
  app.get('/questions/categories', { preHandler: authMiddleware }, async (_req, reply) => {
    try {
      const categories = await prisma.question.findMany({
        where: { source: 'platform', category: { not: null } },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });
      return reply.send(categories.map((c: any) => c.category).filter(Boolean));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });
}
