import { IAdminQuestionRepository } from "../../repositories/IAdminQuestionRepository";

export class ListQuestionsUseCase {
  constructor(private repo: IAdminQuestionRepository) {}
  async execute(): Promise<any[]> {
    return this.repo.findAll();
  }
}