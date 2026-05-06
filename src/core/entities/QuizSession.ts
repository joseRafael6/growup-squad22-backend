export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface QuizSession {
  id: string;
  userId: string;
  quizId: string;
  status: SessionStatus;
  totalScore: number;
  startedAt: Date;
  completedAt?: Date;
  answeredQuestionIds: string[];
}