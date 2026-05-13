import { FastifyRequest, FastifyReply } from 'fastify';
import { GetQuestionsUseCase } from '../../../core/use-case/GetQuestionsUseCase';
import { SubmitAnswerUseCase } from '../../../core/use-case/SubmitAnswerUseCase';
import { GetRankingUseCase } from '../../../core/use-case/GetRankingUseCase'; //NOVO !!!!!!!
import { QuestionViewModel } from '../view-models/QuestionViewModel';
import { RankingViewModel } from '../view-models/RankingViewModel'; //NOVO !!!!!!!!!!!!
import { AppError } from '../../../shared/errors/AppError';

export class QuizController {
  constructor(
    private getQuestionsUseCase: GetQuestionsUseCase,
    private submitAnswerUseCase: SubmitAnswerUseCase,
    private getRankingUseCase: GetRankingUseCase, //NOVO !!!!!!
  ) {}

  async getQuestions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId, quizId } = request.query as any;
      
      if (!userId || !quizId) {
        throw new AppError('userId e quizId são obrigatórios', 400);
      }

      const result = await this.getQuestionsUseCase.execute(userId, quizId);

      return reply.send({
        sessionId: result.sessionId,
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
        sessionId,
        questionId,
        optionId,
        responseTimeMs,
      });

      return reply.status(201).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }
  //NOVO!!!!!!
  async getRanking(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { quizId, userId } = request.query as any;
      if (!quizId || !userId) {
        throw new AppError('quizId e userId são obrigatórios', 400);
      }

      const result = await this.getRankingUseCase.execute(quizId, userId);

      return reply.send({
        top10: result.top10.map(RankingViewModel.toHTTP),
        myRank: result.userRank ? RankingViewModel.toHTTP(result.userRank) : null,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  private handleError(error: any, reply: FastifyReply) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        status: 'error',
        message: error.message,
      });
    }
    console.error(error);
    return reply.status(500).send({
      status: 'error',
      message: 'Erro interno do servidor.',
    });
  }
}