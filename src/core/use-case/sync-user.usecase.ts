import { UserRepository } from '../repositories/userRepository';

interface SyncUserInput {
  email: string;
  name?: string;
  clerkId: string;
  companyName?: string;
  sector?: string;
}

export class SyncUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(data: SyncUserInput) {
    try {
      // Buscar por clerkId primeiro
      let user = await this.userRepository.findByClerkId(data.clerkId);

      if (user) {
        user = await this.userRepository.update(user.id, {
          email: data.email,
          name: data.name,
          companyName: data.companyName,
          sector: data.sector,
        });
        return { user, created: false };
      }

      // Buscar por email
      const existingByEmail = await this.userRepository.findByEmail(data.email);

      if (existingByEmail) {
        user = await this.userRepository.update(existingByEmail.id, {
          email: data.email,
          clerkId: data.clerkId,
          name: data.name,
          companyName: data.companyName,
          sector: data.sector,
        });
        return { user, created: false };
      }

      // Criar novo usuário
      user = await this.userRepository.create({
        email: data.email,
        name: data.name,
        clerkId: data.clerkId,
        companyName: data.companyName,
        sector: data.sector,
      });

      return { user, created: true };
    } catch (error) {
      console.error('Erro no SyncUserUseCase:', error);
      throw error;
    }
  }
}
