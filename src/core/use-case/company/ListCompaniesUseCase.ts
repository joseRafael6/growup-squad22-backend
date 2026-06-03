import { ICompanyRepository } from '../../repositories/ICompanyRepository';
import { Company } from '../../entities/Company';

export class ListCompaniesUseCase {
  constructor(private repo: ICompanyRepository) {}

  async execute(): Promise<Company[]> {
    return this.repo.findAll();
  }
}
