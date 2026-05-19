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
  // Simula o banco de dados em memória
  private questions: Question[] = [...mockQuestions]; 
  // Inicializa a lista com os dados fakes do mock

  async findByQuizId(quizId: string): Promise<Question[]> {
    return this.questions; 
  }

  async findById(id: string): Promise<Question | null> {
    return this.questions.find(q => q.id === id) || null; 
    // Procura pelo ID ou retorna nulo
  }

  async create(question: Question): Promise<Question> {
    this.questions.push(question); // Adiciona a nova questão na lista
    return question;
  }

  async update(question: Question): Promise<Question> {
    const index = this.questions.findIndex(q => q.id === question.id);
    if (index !== -1) this.questions[index] = question; // Substitui os dados antigos se achar o ID
    return question;
  }

  async delete(id: string): Promise<void> {
    this.questions = this.questions.filter(q => q.id !== id); // Remove a questão filtrando a lista
  }
}