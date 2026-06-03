import { ICompanyRepository, CreateCompanyDTO } from '../../repositories/ICompanyRepository';
import { Company } from '../../entities/Company';

export class UpdateCompanyUseCase {
  constructor(private repo: ICompanyRepository) {}

  async execute(id: string, data: Partial<CreateCompanyDTO>): Promise<Company> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error('Empresa não encontrada');
    return this.repo.update(id, data);
  }
}
