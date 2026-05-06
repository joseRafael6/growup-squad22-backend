import { IQuestionRepository } from '../../core/repositories/IQuestionRepository';
import { Question } from '../../core/entities/Question';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Qual é a principal causa de acidentes elétricos?',
    weight: 10,
    timeLimitSeconds: 30,
    alternatives: [
      { id: 'a1', text: 'Falta de treinamento', isCorrect: false },
      { id: 'a2', text: 'Equipamentos defeituosos', isCorrect: false },
      { id: 'a3', text: 'Trabalho em altura', isCorrect: false },
      { id: 'a4', text: 'Contato com partes energizadas', isCorrect: true },
    ],
  },
];

export class InMemoryQuestionRepository implements IQuestionRepository {
  async findByQuizId(quizId: string): Promise<Question[]> {
    return mockQuestions;
  }
}