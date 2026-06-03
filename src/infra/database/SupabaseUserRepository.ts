import { prisma } from './prisma.client';
import { UserRepository, User } from '../../core/repositories/userRepository';

function toUser(user: any): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    clerkId: user.clerkId || undefined,
    companyName: user.companyName || undefined,
    sector: user.sector || undefined,
    createdAt: user.created_at || new Date(),
    updatedAt: user.updated_at || new Date(),
  };
}

export class SupabaseUserRepository implements UserRepository {

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.users.findUnique({ where: { email } });
    return user ? toUser(user) : null;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    const user = await prisma.users.findUnique({ where: { clerkId } });
    return user ? toUser(user) : null;
  }

  async update(id: string, data: {
    email?: string;
    name?: string;
    clerkId?: string;
    companyName?: string;
    sector?: string;
  }): Promise<User> {
    const user = await prisma.users.update({
      where: { id },
      data: {
        email: data.email,
        name: data.name,
        clerkId: data.clerkId,
        companyName: data.companyName,
        sector: data.sector,
        updated_at: new Date(),
      }
    });
    return toUser(user);
  }

  async create(data: {
    email: string;
    name?: string;
    clerkId: string;
    companyName?: string;
    sector?: string;
  }): Promise<User> {
    const user = await prisma.users.create({
      data: {
        email: data.email,
        name: data.name || null,
        clerkId: data.clerkId,
        companyName: data.companyName || null,
        sector: data.sector || null,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });
    return toUser(user);
  }
}
