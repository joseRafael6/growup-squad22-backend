import { IAdminQuestionRepository } from "../../repositories/IAdminQuestionRepository";
import { Question } from "../../entities/Question";

export class CreateQuestionUseCase {
  constructor(private repo: IAdminQuestionRepository) {}
  async execute(data: Omit<Question, "id"> & { quizId: string }): Promise<Question> {
    return this.repo.create(data);
  }
}