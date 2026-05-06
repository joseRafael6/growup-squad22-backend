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
  {
    id: 'q2',
    text: 'O que significa a sigla EPI?',
    weight: 5,
    timeLimitSeconds: 20,
    alternatives: [
      { id: 'b1', text: 'Equipamento de Proteção Individual', isCorrect: true },
      { id: 'b2', text: 'Equipamento de Proteção Industrial', isCorrect: false },
      { id: 'b3', text: 'Equipamento de Prevenção Imediata', isCorrect: false },
    ],
  },
];

export class InMemoryQuestionRepository implements IQuestionRepository {
  async findByQuizId(quizId: string): Promise<Question[]> {
    return mockQuestions;
  }
}