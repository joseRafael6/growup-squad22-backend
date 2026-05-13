import { FastifyInstance } from 'fastify';
import { QuizController } from '../controllers/QuizController';

export async function quizRoutes(app: FastifyInstance, controller: QuizController) {
  app.get('/questions', (request, reply) => controller.getQuestions(request, reply));
  app.post('/answers', (request, reply) => controller.submitAnswer(request, reply));
  app.get('/ranking', (request, reply) => controller.getRanking(request, reply)); //NOVO !!!!!!!
}