import { randomUUID } from 'crypto';
import { IQuestionRepository } from '../repositories/IQuestionRepository';
import { IQuizSessionRepository } from '../repositories/IQuizSessionRepository';
import { Question } from '../entities/Question';
import { QuizSession } from '../entities/QuizSession';

export class GetQuestionsUseCase {
  constructor(
    private questionRepo: IQuestionRepository,
    private sessionRepo: IQuizSessionRepository
  ) {}

  async execute(userId: string, quizId: string): Promise<{
    sessionId: string;
    questions: Question[];
  }> {
    const questions = await this.questionRepo.findByQuizId(quizId);
    if (!questions.length) throw new Error('Quiz não possui perguntas.');

    const session: QuizSession = {
      id: randomUUID(),
      userId,
      quizId,
      status: 'Em_progresso',
      totalScore: 0,
      startedAt: new Date(),
      answeredQuestionIds: [],
    };
    await this.sessionRepo.create(session);

    const shuffled = this.shuffleArray([...questions]);

    return {
      sessionId: session.id,
      questions: shuffled,
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}