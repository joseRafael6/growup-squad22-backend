import { IAdminQuestionRepository } from "../../repositories/IAdminQuestionRepository";
import { Question } from "../../entities/Question";

export class UpdateQuestionUseCase {
  constructor(private repo: IAdminQuestionRepository) {}
  async execute(id: string, data: Partial<Omit<Question, "id">>): Promise<Question> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error("Question not found");
    return this.repo.update(id, data);
  }
}