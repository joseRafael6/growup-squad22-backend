import fastify from 'fastify';
import { InMemoryQuestionRepository } from './infra/database/InMemoryQuestionRepository';
import { InMemoryQuizSessionRepository } from './infra/database/InMemoryQuizSessionRepository';
import { GetQuestionsUseCase } from './core/use-case/GetQuestionsUseCase';
import { SubmitAnswerUseCase } from './core/use-case/SubmitAnswerUseCase';
import { QuizController } from './infra/http/controllers/QuizController';
import { quizRoutes } from './infra/http/routes/quizRoutes';

const app = fastify({ logger: true });

// Instância dos repositórios
const questionRepo = new InMemoryQuestionRepository();
const sessionRepo = new InMemoryQuizSessionRepository();

// Casos de uso
const getQuestionsUseCase = new GetQuestionsUseCase(questionRepo, sessionRepo);
const submitAnswerUseCase = new SubmitAnswerUseCase(sessionRepo, questionRepo);

// Controller
const quizController = new QuizController(getQuestionsUseCase, submitAnswerUseCase);

// Rotas
app.register(quizRoutes, quizController);

// Iniciar servidor
const start = async () => {
  try {
    await app.listen({ port: 3333 });
    console.log('🚀 Servidor rodando em http://localhost:3333');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();