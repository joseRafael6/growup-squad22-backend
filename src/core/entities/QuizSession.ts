export type SessionStatus = 'in_progress' | 'completo' | 'abandonado';

export interface QuizSession {
  id: string;                    // ID único da sessão
  userId: string;                // Quem tá jogando (email ou ID)
  quizId: string;                // Qual quiz está sendo jogado, colocquei como string pq pode ser 
  status: 'Em_progresso' | 'completo' | 'abandonado'; // Estado atual
  totalScore: number;            // Pontuação acumulada
  startedAt: Date;               // Quando começou
  completedAt?: Date;            // Quando terminou (opcional)
  answeredQuestionIds: string[]; // IDs das perguntas já respondidas
}