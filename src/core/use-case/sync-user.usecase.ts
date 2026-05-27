import { UserRepository } from '../repositories/userRepository';

export class SyncUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(data: { email: string; name?: string; clerkId: string }) {
    try {
      // Buscar por clerkId primeiro
      let user = await this.userRepository.findByClerkId(data.clerkId);
      
      if (user) {
        // Se encontrou pelo clerkId, atualizar dados
        user = await this.userRepository.update(user.id, {
          email: data.email,
          name: data.name,
        });
        return { user, created: false };
      }
      
      // Buscar por email (caso já exista sem clerkId)
      const existingByEmail = await this.userRepository.findByEmail(data.email);
      
      if (existingByEmail) {
        // Se existe por email, atualizar com clerkId e demais dados
        user = await this.userRepository.update(existingByEmail.id, {
          email: data.email,
          clerkId: data.clerkId,
          name: data.name,
        });
        return { user, created: false };
      }
      
      // Criar novo usuário
      user = await this.userRepository.create({
        email: data.email,
        name: data.name,
        clerkId: data.clerkId,
      });
      
      return { user, created: true };
    } catch (error) {
      console.error('Erro no SyncUserUseCase:', error);
      throw error;
    }
  }
}