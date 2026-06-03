import { prisma } from './prisma.client';
import { ICompanyRepository, CreateCompanyDTO } from '../../core/repositories/ICompanyRepository';
import { Company, CompanyAdmin } from '../../core/entities/Company';
import { randomBytes } from 'crypto';

function generateInviteCode(companyName: string): string {
  // Ex: "BlackBelt IT" → "BLACKBELT-A3F2"
  const prefix = companyName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${suffix}`;
}

export class PrismaCompanyRepository implements ICompanyRepository {

  async create(data: CreateCompanyDTO): Promise<Company> {
    const inviteCode = generateInviteCode(data.name);
    const company = await prisma.company.create({
      data: {
        name: data.name,
        topic: data.topic,
        questionSource: data.questionSource ?? 'both',
        inviteCode,
      },
    });
    return this.toEntity(company);
  }

  async findById(id: string): Promise<Company | null> {
    const company = await prisma.company.findUnique({ where: { id } });
    return company ? this.toEntity(company) : null;
  }

  async findAll(): Promise<Company[]> {
    const companies = await prisma.company.findMany({ orderBy: { createdAt: 'asc' } });
    return companies.map(c => this.toEntity(c));
  }

  async update(id: string, data: Partial<CreateCompanyDTO>): Promise<Company> {
    const company = await prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        topic: data.topic,
        questionSource: data.questionSource,
      },
    });
    return this.toEntity(company);
  }

  async delete(id: string): Promise<void> {
    await prisma.company_admin.deleteMany({ where: { companyId: id } });
    await prisma.company_member.deleteMany({ where: { companyId: id } });
    await prisma.question.updateMany({
      where: { companyId: id },
      data: { companyId: null, source: 'platform' },
    });
    await prisma.company.delete({ where: { id } });
  }

  async addAdmin(companyId: string, userId: string): Promise<CompanyAdmin> {
    const admin = await prisma.company_admin.create({ data: { companyId, userId } });
    return this.toAdminEntity(admin);
  }

  async removeAdmin(companyId: string, userId: string): Promise<void> {
    await prisma.company_admin.deleteMany({ where: { companyId, userId } });
  }

  async listAdmins(companyId: string): Promise<CompanyAdmin[]> {
    const admins = await prisma.company_admin.findMany({ where: { companyId } });
    return admins.map(a => this.toAdminEntity(a));
  }

  async isAdmin(companyId: string, userId: string): Promise<boolean> {
    const record = await prisma.company_admin.findFirst({ where: { companyId, userId } });
    return !!record;
  }

  async findCompaniesByAdmin(userId: string): Promise<Company[]> {
    const records = await prisma.company_admin.findMany({
      where: { userId },
      include: { company: true },
    });
    return records.map(r => this.toEntity(r.company));
  }

  private toEntity(record: any): Company {
    return {
      id: record.id,
      name: record.name,
      topic: record.topic ?? undefined,
      questionSource: record.questionSource as 'platform' | 'company' | 'both',
      inviteCode: record.inviteCode,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toAdminEntity(record: any): CompanyAdmin {
    return {
      id: record.id,
      userId: record.userId,
      companyId: record.companyId,
      createdAt: record.createdAt,
    };
  }
}
