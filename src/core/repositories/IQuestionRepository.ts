import { Question } from '../entities/Question';

export interface IQuestionRepository {
  findByQuizId(quizId: string): Promise<Question[]>; //pede um ID do quiz (QuizID) para devolver as perguntas
}