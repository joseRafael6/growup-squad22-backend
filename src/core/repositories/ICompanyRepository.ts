import { Company, CompanyAdmin } from '../entities/Company';

export interface CreateCompanyDTO {
  name: string;
  topic?: string;
  questionSource?: 'platform' | 'company' | 'both';
}

export interface ICompanyRepository {
  create(data: CreateCompanyDTO): Promise<Company>;
  findById(id: string): Promise<Company | null>;
  findAll(): Promise<Company[]>;
  update(id: string, data: Partial<CreateCompanyDTO>): Promise<Company>;
  delete(id: string): Promise<void>;

  // Admins
  addAdmin(companyId: string, userId: string): Promise<CompanyAdmin>;
  removeAdmin(companyId: string, userId: string): Promise<void>;
  listAdmins(companyId: string): Promise<CompanyAdmin[]>;
  isAdmin(companyId: string, userId: string): Promise<boolean>;
  // Retorna todas as empresas onde o usuário é admin
  findCompaniesByAdmin(userId: string): Promise<Company[]>;
}
