// src/infra/database/repositories/InMemoryQuizSessionRepository.ts
import { IQuizSessionRepository } from "../../core/repositories/IQuizSessionRepository";
import { QuizSession } from "../../core/entities/QuizSession";

export class InMemoryQuizSessionRepository implements IQuizSessionRepository {
  private sessions: Map<string, QuizSession> = new Map();

  async create(session: QuizSession): Promise<QuizSession> {
    this.sessions.set(session.id, { ...session });
    return session;
  }

  async findById(id: string): Promise<QuizSession | null> {
    return this.sessions.get(id) || null;
  }

  async update(session: QuizSession): Promise<QuizSession> {
    this.sessions.set(session.id, { ...session });
    return session;
  }

  // NOVO MÉTODO!!!!!!
  async findByQuizId(quizId: string): Promise<QuizSession[]> {
    const allSessions = Array.from(this.sessions.values());
    return allSessions.filter(session => session.quizId === quizId);
  }
}