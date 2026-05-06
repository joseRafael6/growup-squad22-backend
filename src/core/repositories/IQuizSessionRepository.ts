import { QuizSession } from '../entities/QuizSession';

export interface IQuizSessionRepository {
  create(session: QuizSession): Promise<QuizSession>;
  findById(id: string): Promise<QuizSession | null>;
  update(session: QuizSession): Promise<QuizSession>;
}