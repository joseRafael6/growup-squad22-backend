import { FastifyInstance } from 'fastify'; 
import { AdminQuestionController } from '../controllers/AdminQuestionController'; // Controller das questões
import { ensureAdmin } from '../middlewares/ensureAdmin'; // Middleware de admin

export async function adminRoutes(app: FastifyInstance, controller: AdminQuestionController) {
  // Protege as rotas de admin
  app.addHook('preHandler', ensureAdmin);

  app.post('/admin/questions', (req, rep) => controller.create(req, rep)); 
  // Criar questão
  app.put('/admin/questions/:id', (req, rep) => controller.update(req, rep)); 
  // Atualizar questão
  app.delete('/admin/questions/:id', (req, rep) => controller.delete(req, rep)); 
  // Deletar questão
}