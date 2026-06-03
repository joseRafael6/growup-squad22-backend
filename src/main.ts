import 'dotenv/config';
import fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PrismaQuestionRepository } from './infra/database/PrismaQuestionRepository';
import { PrismaQuizSessionRepository } from './infra/database/PrismaQuizSessionRepository';
import { SupabaseUserRepository } from './infra/database/SupabaseUserRepository';
import { GetQuestionsUseCase } from './core/use-case/GetQuestionsUseCase';
import { SubmitAnswerUseCase } from './core/use-case/SubmitAnswerUseCase';
import { GetRankingUseCase } from './core/use-case/GetRankingUseCase';
import { QuizController } from './infra/http/controllers/QuizController';
import { quizRoutes } from './infra/http/routes/quizRoutes';
import { userRoutes } from './infra/http/routes/user.routes';
import { webhookRoutes } from './infra/http/routes/webhook.routes';
import { adminRoutes } from './infra/http/routes/admin.routes';
import { companyRoutes } from './infra/http/routes/company.routes';
import { companyQuizRoutes } from './infra/http/routes/company.quiz.routes';

const app = fastify({ logger: true, bodyLimit: 1048576 });

app.register(cors, {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'mysecretkey',
});

app.register(rateLimit, {
  max: 40,
  timeWindow: '1 minute',
});

const questionRepo = new PrismaQuestionRepository();
const sessionRepo = new PrismaQuizSessionRepository();
const userRepo = new SupabaseUserRepository();

const getQuestionsUseCase = new GetQuestionsUseCase(questionRepo, sessionRepo, userRepo);
const submitAnswerUseCase = new SubmitAnswerUseCase(sessionRepo, questionRepo);
const getRankingUseCase = new GetRankingUseCase();

const quizController = new QuizController(getQuestionsUseCase, submitAnswerUseCase, getRankingUseCase);

app.register(webhookRoutes);
app.register(userRoutes, { prefix: '/api' });
app.register(quizRoutes, { controller: quizController });
app.register(adminRoutes);
app.register(companyRoutes);
app.register(companyQuizRoutes);

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`\n🚀 Servidor rodando em http://localhost:${port}`);
    console.log('\n📋 Rotas de Quiz:');
    console.log('   GET  /questions?mode=global');
    console.log('   GET  /questions?mode=global_category&category=LGPD&limit=10');
    console.log('   GET  /questions?mode=company_quiz&companyQuizId=<id>');
    console.log('   POST /answers');
    console.log('   GET  /ranking?scope=global&userId=<id>');
    console.log('   GET  /ranking?scope=company&companyId=<id>&userId=<id>');
    console.log('   GET  /questions/categories');
    console.log('\n👑 Rotas Admin (plataforma):');
    console.log('   GET  /admin/questions');
    console.log('   POST /admin/questions  (com campo category opcional)');
    console.log('   PUT  /admin/questions/:id');
    console.log('   DELETE /admin/questions/:id');
    console.log('\n🏢 Rotas Empresa:');
    console.log('   POST /companies');
    console.log('   GET  /companies/:id/questions');
    console.log('   POST /companies/:id/questions');
    console.log('   GET  /companies/:companyId/quizzes');
    console.log('   POST /companies/:companyId/quizzes');
    console.log('   PUT  /companies/:companyId/quizzes/:quizId');
    console.log('   DELETE /companies/:companyId/quizzes/:quizId');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();