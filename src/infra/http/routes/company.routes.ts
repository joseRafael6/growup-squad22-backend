import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { PrismaCompanyRepository } from '../../database/PrismaCompanyRepository';
import { PrismaAdminQuestionRepository } from '../../database/PrismaAdminQuestionRepository';
import { SupabaseUserRepository } from '../../database/SupabaseUserRepository';
import { CreateCompanyUseCase } from '../../../core/use-case/company/CreateCompanyUseCase';
import { ListCompaniesUseCase } from '../../../core/use-case/company/ListCompaniesUseCase';
import { UpdateCompanyUseCase } from '../../../core/use-case/company/UpdateCompanyUseCase';
import { DeleteCompanyUseCase } from '../../../core/use-case/company/DeleteCompanyUseCase';
import { ManageCompanyAdminUseCase } from '../../../core/use-case/company/ManageCompanyAdminUseCase';
import { CompanyQuestionUseCase } from '../../../core/use-case/company/CompanyQuestionUseCase';

export async function companyRoutes(app: FastifyInstance) {
  const companyRepo = new PrismaCompanyRepository();
  const questionRepo = new PrismaAdminQuestionRepository();
  const userRepo = new SupabaseUserRepository();

  const createCompany = new CreateCompanyUseCase(companyRepo);
  const listCompanies = new ListCompaniesUseCase(companyRepo);
  const updateCompany = new UpdateCompanyUseCase(companyRepo);
  const deleteCompany = new DeleteCompanyUseCase(companyRepo);
  const manageAdmins = new ManageCompanyAdminUseCase(companyRepo, userRepo);
  const companyQuestions = new CompanyQuestionUseCase(questionRepo, companyRepo);

  // ─── Helper: pega o userId (UUID do banco) a partir do token Clerk ────────
  async function resolveUserId(request: FastifyRequest): Promise<string> {
    const clerkId = (request as any).user?.sub;
    const user = await userRepo.findByClerkId(clerkId);
    if (!user) throw new Error('Usuário não encontrado. Sincronize primeiro.');
    return user.id;
  }

  // ─── Helper: verifica se o usuário é admin da empresa ────────────────────
  async function assertCompanyAdmin(companyId: string, userId: string, reply: FastifyReply) {
    const isAdm = await companyRepo.isAdmin(companyId, userId);
    if (!isAdm) {
      reply.status(403).send({ error: 'Acesso negado. Você não é admin desta empresa.' });
      return false;
    }
    return true;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ROTAS DE EMPRESA — apenas super-admin da plataforma (role = "admin")
  // ════════════════════════════════════════════════════════════════════════════

  // GET /companies — lista todas as empresas (super-admin)
  app.get('/companies', { preHandler: adminMiddleware }, async (_req, reply) => {
    try {
      const companies = await listCompanies.execute();
      return reply.send(companies);
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });

  // POST /companies — cadastra nova empresa (super-admin)
  app.post('/companies', { preHandler: adminMiddleware }, async (request, reply) => {
    try {
      const { name, topic, questionSource } = request.body as any;
      const company = await createCompany.execute({ name, topic, questionSource });
      return reply.status(201).send(company);
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // PUT /companies/:id — edita empresa (super-admin)
  app.put('/companies/:id', { preHandler: adminMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;
      const company = await updateCompany.execute(id, data);
      return reply.send(company);
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // DELETE /companies/:id — remove empresa (super-admin)
  app.delete('/companies/:id', { preHandler: adminMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await deleteCompany.execute(id);
      return reply.send({ message: 'Empresa removida com sucesso' });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // ADMINS DA EMPRESA
  // ════════════════════════════════════════════════════════════════════════════

  // GET /companies/:id/admins — lista admins (super-admin)
  app.get('/companies/:id/admins', { preHandler: adminMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const admins = await manageAdmins.listAdmins(id);
      return reply.send(admins);
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // POST /companies/:id/admins — adiciona admin à empresa (super-admin)
  // Body: { email: string }
  app.post('/companies/:id/admins', { preHandler: adminMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { email } = request.body as { email: string };
      await manageAdmins.addAdmin(id, email);
      return reply.status(201).send({ message: 'Admin adicionado com sucesso' });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // DELETE /companies/:id/admins/:userId — remove admin (super-admin)
  app.delete('/companies/:id/admins/:userId', { preHandler: adminMiddleware }, async (request, reply) => {
    try {
      const { id, userId } = request.params as { id: string; userId: string };
      await manageAdmins.removeAdmin(id, userId);
      return reply.send({ message: 'Admin removido com sucesso' });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // GET /my-companies — empresas onde o usuário autenticado é admin
  app.get('/my-companies', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const clerkId = (request as any).user?.sub;
      const companies = await manageAdmins.getMyCompanies(clerkId);
      return reply.send(companies);
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // PERGUNTAS DA EMPRESA
  // ════════════════════════════════════════════════════════════════════════════

  // GET /companies/:id/questions — lista perguntas disponíveis para a empresa
  // (respeita o questionSource: platform | company | both)
  // Query opcional: ?quizId=quiz_1
  app.get('/companies/:id/questions', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { quizId } = request.query as { quizId?: string };
      const userId = await resolveUserId(request);
      const ok = await assertCompanyAdmin(id, userId, reply);
      if (!ok) return;

      const questions = await companyQuestions.listForCompany(id, quizId);
      return reply.send(questions);
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // POST /companies/:id/questions — cria pergunta para a empresa
  app.post('/companies/:id/questions', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = await resolveUserId(request);
      const ok = await assertCompanyAdmin(id, userId, reply);
      if (!ok) return;

      const data = request.body as any;
      if (!data.text || !data.quizId || !data.alternatives?.length) {
        return reply.status(400).send({ error: 'Campos obrigatórios: text, quizId, alternatives' });
      }

      const question = await companyQuestions.createForCompany(id, data);
      return reply.status(201).send(question);
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // PUT /companies/:id/questions/:questionId — edita pergunta da empresa
  app.put('/companies/:id/questions/:questionId', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id, questionId } = request.params as { id: string; questionId: string };
      const userId = await resolveUserId(request);
      const ok = await assertCompanyAdmin(id, userId, reply);
      if (!ok) return;

      const data = request.body as any;
      const question = await companyQuestions.updateForCompany(id, questionId, data);
      return reply.send(question);
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // DELETE /companies/:id/questions/:questionId — deleta pergunta da empresa
  app.delete('/companies/:id/questions/:questionId', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id, questionId } = request.params as { id: string; questionId: string };
      const userId = await resolveUserId(request);
      const ok = await assertCompanyAdmin(id, userId, reply);
      if (!ok) return;

      await companyQuestions.deleteForCompany(id, questionId);
      return reply.send({ message: 'Pergunta deletada com sucesso' });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });
}
