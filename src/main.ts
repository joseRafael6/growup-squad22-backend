// src/main.ts
import fastify from 'fastify';
import { InMemoryQuestionRepository } from './infra/database/InMemoryQuestionRepository';
import { InMemoryQuizSessionRepository } from './infra/database/InMemoryQuizSessionRepository';
import { GetQuestionsUseCase } from './core/use-case/GetQuestionsUseCase';
import { SubmitAnswerUseCase } from './core/use-case/SubmitAnswerUseCase';
import { GetRankingUseCase } from './core/use-case/GetRankingUseCase'; //NOVO !!!!!!
import { QuizController } from './infra/http/controllers/QuizController';
import { quizRoutes } from './infra/http/routes/quizRoutes';
import { AdminQuestionUseCase } from './core/use-case/AdminQuestionUseCase'; // NOVO (Epic 4)
import { AdminQuestionController } from './infra/http/controllers/AdminQuestionController'; // NOVO (Epic 4)
import { adminRoutes } from './infra/http/routes/adminRoutes'; // NOVO (Epic 4)



const app = fastify({ logger: true });

// Repositórios
const questionRepo = new InMemoryQuestionRepository();
const sessionRepo = new InMemoryQuizSessionRepository();

// Casos de uso
const getQuestionsUseCase = new GetQuestionsUseCase(questionRepo, sessionRepo);
const submitAnswerUseCase = new SubmitAnswerUseCase(sessionRepo, questionRepo);
const getRankingUseCase = new GetRankingUseCase(sessionRepo); // NOVO
const adminQuestionUseCase = new AdminQuestionUseCase(questionRepo); // NOVO (Epic 4)


// Controller
const quizController = new QuizController(
  getQuestionsUseCase,
  submitAnswerUseCase,
  getRankingUseCase, // NOVO!!!!!!
);

const adminQuestionController = new AdminQuestionController(adminQuestionUseCase); // NOVO (Epic 4)

app.addHook('preHandler', async (request) => {
  (request as any).user = { id: 'usr_admin123', role: 'admin' }; 
});


// Rotas
app.register(quizRoutes, quizController);
app.register(adminRoutes, adminQuestionController); // NOVO (Epic 4)

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