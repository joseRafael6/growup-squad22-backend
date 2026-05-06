import { Question } from '../entities/Question';

export interface IQuestionRepository {
  findByQuizId(quizId: string): Promise<Question[]>;
}