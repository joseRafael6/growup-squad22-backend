import { Question } from '../../../core/entities/Question';

export class QuestionViewModel {
  static toHTTP(question: Question) {
    return {
      id: question.id,
      text: question.text,
      weight: question.weight,
      timeLimitSeconds: question.timeLimitSeconds,
      alternatives: question.alternatives.map(a => ({
        id: a.id,
        text: a.text,
      })),
    };
  }
}