import { Question } from '../entities/Question';

export interface IQuestionRepository {
  findByQuizId(quizId: string): Promise<Question[]>; //pede um ID do quiz (QuizID) para devolver 
  findById(id: string): Promise<Question | null>;// Pede o ID de uma pergunta e a devolve
  create(question: Question): Promise<Question>;// Salva uma nova pergunta e a devolve
  update(question: Question): Promise<Question>;// Atualiza uma pergunta existente e a devolve
  delete(id: string): Promise<void>;// Pede o ID de uma pergunta e a deleta
}
