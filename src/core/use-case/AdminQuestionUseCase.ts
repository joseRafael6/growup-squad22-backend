import { IQuestionRepository } from '../repositories/IQuestionRepository';
import { Question, Alternative } from '../entities/Question';
import { AppError } from '../../shared/errors/AppError';
import { randomUUID } from 'crypto';

interface CreateQuestionInput {
  quizId: string; 
  text: string;
  weight: number;
  timeLimitSeconds: number;
  alternatives: Omit<Alternative, 'id'>[];
}

export class AdminQuestionUseCase {
  constructor(private questionRepo: IQuestionRepository) {}

  async create(input: CreateQuestionInput): Promise<Question> {
    if (!input.text || input.alternatives.length < 2) {
      throw new AppError('Dados insuficientes para criar a questão.', 400);
    }

    const hasCorrect = input.alternatives.some(a => a.isCorrect);
    if (!hasCorrect) {
      throw new AppError('A questão precisa de pelo menos uma alternativa correta.', 400);
    }

    const question: Question = {
      id: randomUUID(),
      text: input.text,
      weight: input.weight,
      timeLimitSeconds: input.timeLimitSeconds,
      alternatives: input.alternatives.map(a => ({
        id: randomUUID(),
        text: a.text,
        isCorrect: a.isCorrect
      }))
    };

    return await this.questionRepo.create(question);
  }

  async update(id: string, input: Partial<CreateQuestionInput>): Promise<Question> {
    const question = await this.questionRepo.findById(id);
    if (!question) throw new AppError('Questão não encontrada.', 404);

    if (input.text) question.text = input.text;
    if (input.weight !== undefined) question.weight = input.weight;
    if (input.timeLimitSeconds !== undefined) question.timeLimitSeconds = input.timeLimitSeconds;
    
    if (input.alternatives) {
      const hasCorrect = input.alternatives.some(a => a.isCorrect);
      if (!hasCorrect) {
        throw new AppError('A questão atualizada precisa de uma alternativa correta.', 400);
      }
      question.alternatives = input.alternatives.map(a => ({
        id: randomUUID(),
        text: a.text,
        isCorrect: a.isCorrect
      }));
    }

    return await this.questionRepo.update(question);
  }

  async delete(id: string): Promise<void> {
    const question = await this.questionRepo.findById(id);
    if (!question) throw new AppError('Questão não encontrada.', 404);
    
    await this.questionRepo.delete(id);
  }
}