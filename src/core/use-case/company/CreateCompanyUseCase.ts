import { ICompanyRepository, CreateCompanyDTO } from '../../repositories/ICompanyRepository';
import { Company } from '../../entities/Company';

export class CreateCompanyUseCase {
  constructor(private repo: ICompanyRepository) {}

  async execute(data: CreateCompanyDTO): Promise<Company> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Nome da empresa é obrigatório');
    }
    return this.repo.create({
      name: data.name.trim(),
      topic: data.topic?.trim(),
      questionSource: data.questionSource ?? 'both',
    });
  }
}
