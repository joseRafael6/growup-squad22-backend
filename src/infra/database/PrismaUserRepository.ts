import { prisma } from './prisma.client';
import { UserRepository, User } from '../../core/repositories/userRepository';

export class PrismaUserRepository implements UserRepository {

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      clerkId: user.clerkId || undefined,
      createdAt: user.created_at || new Date(),
      updatedAt: user.updated_at || new Date(),
    };
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    const user = await prisma.users.findUnique({
      where: { clerkId }
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      clerkId: user.clerkId || undefined,
      createdAt: user.created_at || new Date(),
      updatedAt: user.updated_at || new Date(),
    };
  }

  async update(id: string, data: { email?: string; name?: string; clerkId?: string }): Promise<User> {
    const user = await prisma.users.update({
      where: { id },
      data: {
        email: data.email,
        name: data.name,
        clerkId: data.clerkId,
        updated_at: new Date(),
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      clerkId: user.clerkId || undefined,
      createdAt: user.created_at || new Date(),
      updatedAt: user.updated_at || new Date(),
    };
  }

  async create(data: { email: string; name?: string; clerkId: string }): Promise<User> {
    const user = await prisma.users.create({
      data: {
        email: data.email,
        name: data.name || null,
        clerkId: data.clerkId,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      clerkId: user.clerkId || undefined,
      createdAt: user.created_at || new Date(),
      updatedAt: user.updated_at || new Date(),
    };
  }
}
