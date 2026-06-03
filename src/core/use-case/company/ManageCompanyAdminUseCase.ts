import { ICompanyRepository } from '../../repositories/ICompanyRepository';
import { UserRepository } from '../../repositories/userRepository';

export class ManageCompanyAdminUseCase {
  constructor(
    private companyRepo: ICompanyRepository,
    private userRepo: UserRepository,
  ) {}

  async addAdmin(companyId: string, userEmail: string): Promise<void> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) throw new Error('Empresa não encontrada');

    const user = await this.userRepo.findByEmail(userEmail);
    if (!user) throw new Error('Usuário não encontrado. O usuário deve estar cadastrado na plataforma.');

    const already = await this.companyRepo.isAdmin(companyId, user.id);
    if (already) throw new Error('Este usuário já é admin desta empresa');

    await this.companyRepo.addAdmin(companyId, user.id);
  }

  async removeAdmin(companyId: string, userId: string): Promise<void> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) throw new Error('Empresa não encontrada');
    await this.companyRepo.removeAdmin(companyId, userId);
  }

  async listAdmins(companyId: string) {
    return this.companyRepo.listAdmins(companyId);
  }

  async getMyCompanies(clerkId: string) {
    const user = await this.userRepo.findByClerkId(clerkId);
    if (!user) throw new Error('Usuário não encontrado');
    return this.companyRepo.findCompaniesByAdmin(user.id);
  }
}
