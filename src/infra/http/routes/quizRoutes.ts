import { FastifyInstance } from 'fastify';
import { QuizController } from '../controllers/QuizController';
import { authMiddleware } from '../middlewares/auth.middleware';

interface QuizRouteOptions {
  controller: QuizController;
}

export async function quizRoutes(app: FastifyInstance, opts: QuizRouteOptions) {
  const { controller } = opts;

  // Todas as rotas do quiz exigem token JWT válido
  app.addHook('preHandler', authMiddleware);

  app.get('/questions', (request, reply) => controller.getQuestions(request, reply));
  app.post('/answers', (request, reply) => controller.submitAnswer(request, reply));
  app.get('/ranking', (request, reply) => controller.getRanking(request, reply));
}
