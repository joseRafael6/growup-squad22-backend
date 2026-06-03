import { ICompanyRepository } from '../../repositories/ICompanyRepository';

export class DeleteCompanyUseCase {
  constructor(private repo: ICompanyRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error('Empresa não encontrada');
    await this.repo.delete(id);
  }
}
