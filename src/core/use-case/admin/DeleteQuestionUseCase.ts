import { IAdminQuestionRepository } from "../../repositories/IAdminQuestionRepository";

export class DeleteQuestionUseCase {
  constructor(private repo: IAdminQuestionRepository) {}
  async execute(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}