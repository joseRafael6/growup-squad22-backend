import { FastifyRequest, FastifyReply } from 'fastify';
import { GetQuestionsUseCase } from '../../../core/use-case/GetQuestionsUseCase';
import { SubmitAnswerUseCase } from '../../../core/use-case/SubmitAnswerUseCase';
import { GetRankingUseCase } from '../../../core/use-case/GetRankingUseCase';
import { QuestionViewModel } from '../view-models/QuestionViewModel';
import { RankingViewModel } from '../view-models/RankingViewModel';
import { AppError } from '../../../shared/errors/AppError';
import { prisma } from '../../database/prisma.client';

export class QuizController {
  constructor(
    private getQuestionsUseCase: GetQuestionsUseCase,
    private submitAnswerUseCase: SubmitAnswerUseCase,
    private getRankingUseCase: GetRankingUseCase,
  ) {}

  async getQuestions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const clerkId = (request as any).user?.sub;
      if (!clerkId) throw new AppError('Token inválido', 401);

      const {
        mode = 'global',
        category,
        companyQuizId,
        limit,
      } = request.query as any;

      const result = await this.getQuestionsUseCase.execute({
        clerkId,
        mode,
        category,
        companyQuizId,
        limit: limit ? parseInt(limit) : undefined,
      });

      return reply.send({
        sessionId: result.sessionId,
        rankingScope: result.rankingScope,
        questions: result.questions.map(QuestionViewModel.toHTTP),
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async submitAnswer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { sessionId, questionId, optionId, responseTimeMs } = request.body as any;
      if (!sessionId || !questionId || !optionId || !responseTimeMs) {
        throw new AppError('Todos os campos são obrigatórios', 400);
      }
      const result = await this.submitAnswerUseCase.execute({
        sessionId, questionId, optionId, responseTimeMs,
      });
      return reply.status(201).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async getRanking(request: FastifyRequest, reply: FastifyReply) {
    try {
      const clerkId = (request as any).user?.sub;
      if (!clerkId) throw new AppError('Token inválido', 401);

      const { scope = 'global', companyId } = request.query as any;

      // Resolve o ID interno do usuário a partir do clerkId do token
      const user = await prisma.users.findUnique({ where: { clerkId } });
      if (!user) throw new AppError('Usuário não encontrado', 404);

      let result;
      if (scope === 'company') {
        if (!companyId) throw new AppError('companyId é obrigatório para ranking da empresa', 400);
        result = await this.getRankingUseCase.executeCompany(companyId, user.id);
      } else {
        result = await this.getRankingUseCase.executeGlobal(user.id);
      }

      return reply.send({
        scope,
        top10: result.top10.map(RankingViewModel.toHTTP),
        myRank: result.userRank ? RankingViewModel.toHTTP(result.userRank) : null,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async finishSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const clerkId = (request as any).user?.sub;
      if (!clerkId) throw new AppError('Token inválido', 401);

      const session = await this.submitAnswerUseCase['sessionRepo'].findById(sessionId);
      if (!session) throw new AppError('Sessão não encontrada.', 404);
      if (session.status === 'completo') {
        return reply.send({ message: 'Sessão já finalizada.', totalScore: session.totalScore });
      }

      session.status = 'completo';
      await this.submitAnswerUseCase['sessionRepo'].update(session);

      return reply.send({ message: 'Sessão finalizada.', totalScore: session.totalScore });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  private handleError(error: any, reply: FastifyReply) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ status: 'error', message: error.message });
    }
    console.error(error);
    return reply.status(500).send({ status: 'error', message: error.message || 'Erro interno do servidor.' });
  }
}
