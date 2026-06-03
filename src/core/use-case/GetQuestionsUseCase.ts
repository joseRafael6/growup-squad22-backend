import { randomUUID } from 'crypto';
import { IQuestionRepository } from '../repositories/IQuestionRepository';
import { IQuizSessionRepository } from '../repositories/IQuizSessionRepository';
import { UserRepository } from '../repositories/userRepository';
import { Question } from '../entities/Question';
import { QuizSession } from '../entities/QuizSession';
import { prisma } from '../../infra/database/prisma.client';

const MIN_QUESTIONS = 10;

export interface GetQuestionsInput {
  clerkId: string;
  // Modo do quiz:
  // "global"          → banco global, sem filtro
  // "global_category" → banco global filtrado por categoria
  // "company_quiz"    → quiz salvo da empresa (companyQuizId obrigatório)
  mode: 'global' | 'global_category' | 'company_quiz';
  category?: string;         // Para mode = "global_category"
  companyQuizId?: string;    // Para mode = "company_quiz"
  limit?: number;            // Quantidade desejada (mínimo: 10)
}

export class GetQuestionsUseCase {
  constructor(
    private questionRepo: IQuestionRepository,
    private sessionRepo: IQuizSessionRepository,
    private userRepo: UserRepository,
  ) {}

  async execute(input: GetQuestionsInput): Promise<{
    sessionId: string;
    questions: Question[];
    rankingScope: 'global' | 'company';
  }> {
    const { clerkId, mode, category, companyQuizId } = input;
    const limit = Math.max(input.limit ?? MIN_QUESTIONS, MIN_QUESTIONS);

    // 1. Resolve usuário
    const user = await this.userRepo.findByClerkId(clerkId);
    if (!user) throw new Error('Usuário não encontrado. Sincronize primeiro.');

    let questions: Question[] = [];
    let rankingScope: 'global' | 'company' = 'global';
    let resolvedCompanyQuizId: string | null = null;
    let quizId = 'global';

    // 2. Seleciona as perguntas conforme o modo
    if (mode === 'global') {
      questions = await this.questionRepo.findGlobal({ limit });
      quizId = 'global';
      rankingScope = 'global';

    } else if (mode === 'global_category') {
      if (!category) throw new Error('Categoria é obrigatória para este modo.');
      questions = await this.questionRepo.findGlobal({ category, limit });
      quizId = `global_${category}`;
      rankingScope = 'global';

    } else if (mode === 'company_quiz') {
      if (!companyQuizId) throw new Error('companyQuizId é obrigatório para quiz da empresa.');

      // Carrega o quiz da empresa com as perguntas vinculadas
      const companyQuiz = await prisma.company_quiz.findUnique({
        where: { id: companyQuizId },
        include: {
          questions: {
            include: { question: { include: { alternatives: true } } },
          },
        },
      });

      if (!companyQuiz) throw new Error('Quiz da empresa não encontrado.');

      questions = companyQuiz.questions.map((cqq: any) => ({
        id: cqq.question.id,
        text: cqq.question.text,
        weight: cqq.question.weight,
        timeLimitSeconds: cqq.question.timeLimitSeconds,
        alternatives: cqq.question.alternatives.map((a: any) => ({
          id: a.id,
          text: a.text,
          isCorrect: a.isCorrect,
        })),
      }));

      quizId = `company_quiz_${companyQuizId}`;
      rankingScope = 'company';
      resolvedCompanyQuizId = companyQuizId;
    }

    if (questions.length < MIN_QUESTIONS) {
      throw new Error(
        `O quiz precisa de no mínimo ${MIN_QUESTIONS} perguntas. Disponíveis: ${questions.length}.`
      );
    }

    // 3. Embaralha perguntas e alternativas
    const shuffledQuestions = this.shuffle(questions).map(q => ({
      ...q,
      alternatives: this.shuffle(q.alternatives),
    }));

    // 4. Cria a sessão
    const session: QuizSession = {
      id: randomUUID(),
      userId: user.id,
      quizId,
      status: 'Em_progresso',
      totalScore: 0,
      startedAt: new Date(),
      answeredQuestionIds: [],
    };

    // Salva sessão com campos extras via Prisma direto
    await prisma.quiz_session.create({
      data: {
        id: session.id,
        userId: user.id,
        quizId,
        companyQuizId: resolvedCompanyQuizId,
        rankingScope,
        startTime: session.startedAt,
        score: 0,
      },
    });

    return {
      sessionId: session.id,
      questions: shuffledQuestions,
      rankingScope,
    };
  }

  // Mantido para compatibilidade com código legado que passa clerkId + quizId
  async executeLegacy(clerkId: string, quizId: string): Promise<{
    sessionId: string;
    questions: Question[];
  }> {
    const result = await this.execute({ clerkId, mode: 'global' });
    return { sessionId: result.sessionId, questions: result.questions };
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
