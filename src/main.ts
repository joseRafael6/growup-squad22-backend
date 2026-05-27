import 'dotenv/config';
import fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { PrismaQuestionRepository } from './infra/database/PrismaQuestionRepository';
import { PrismaQuizSessionRepository } from './infra/database/PrismaQuizSessionRepository';
import { GetQuestionsUseCase } from './core/use-case/GetQuestionsUseCase';
import { SubmitAnswerUseCase } from './core/use-case/SubmitAnswerUseCase';
import { GetRankingUseCase } from './core/use-case/GetRankingUseCase';
import { QuizController } from './infra/http/controllers/QuizController';
import { quizRoutes } from './infra/http/routes/quizRoutes';
import { userRoutes } from './infra/http/routes/user.routes';
import { webhookRoutes } from './infra/http/routes/webhook.routes'; // 👈 ADICIONE ESTA LINHA

const app = fastify({
  logger: true,
  bodyLimit: 1048576,
});

// Configurar JWT
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'mysecretkey'
});

// Repositórios
const questionRepo = new PrismaQuestionRepository();
const sessionRepo = new PrismaQuizSessionRepository();

// Casos de uso
const getQuestionsUseCase = new GetQuestionsUseCase(questionRepo, sessionRepo);
const submitAnswerUseCase = new SubmitAnswerUseCase(sessionRepo, questionRepo);
const getRankingUseCase = new GetRankingUseCase(sessionRepo);

// Controller
const quizController = new QuizController(
  getQuestionsUseCase,
  submitAnswerUseCase,
  getRankingUseCase,
);

// 👈 REGISTRAR ROTA DO WEBHOOK
app.register(webhookRoutes);
app.register(userRoutes, { prefix: '/api' });
app.register(quizRoutes, { controller: quizController });

// Iniciar servidor
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
    console.log('\n📋 Rotas disponíveis:');
    console.log('   - POST /api/webhooks/clerk (webhook)');
    console.log('   - GET  /api/health');
    console.log('   - POST /api/users/sync');
    console.log('   - GET  /questions');
    console.log('   - POST /answers');
    console.log('   - GET  /ranking');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();