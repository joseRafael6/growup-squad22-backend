import { QuizSession } from '../entities/QuizSession';

export interface IQuizSessionRepository {
  create(session: QuizSession): Promise<QuizSession>;    // Criar nova sessão
  findById(id: string): Promise<QuizSession | null>;     // Buscar por ID
  update(session: QuizSession): Promise<QuizSession>;    // Atualizar sessão
  findByQuizId(quizId: string): Promise<QuizSession[]>;  //NOVO!!!!!
}