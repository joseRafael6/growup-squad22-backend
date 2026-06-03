import { Question } from "../entities/Question";

export interface IAdminQuestionRepository {
  findAll(): Promise<Question[]>;
  findById(id: string): Promise<Question | null>;
  create(data: Omit<Question, "id"> & { quizId: string }): Promise<Question>;
  update(id: string, data: Partial<Omit<Question, "id">>): Promise<Question>;
  delete(id: string): Promise<void>;
}