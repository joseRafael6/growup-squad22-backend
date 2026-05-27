import { FastifyInstance } from 'fastify';
import { prisma } from '../../database/prisma.client'; // 👈 ADICIONE ESTA LINHA
import { SupabaseUserRepository } from '../../database/SupabaseUserRepository';
import { SyncUserUseCase } from '../../../core/use-case/sync-user.usecase';

export async function webhookRoutes(app: FastifyInstance) {
  const userRepository = new SupabaseUserRepository();
  const syncUserUseCase = new SyncUserUseCase(userRepository);

  app.post('/api/webhooks/clerk', async (request, reply) => {
    const { type, data } = request.body as any;
    
    const email = data.email_addresses?.[0]?.email_address;
    const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    const clerkId = data.id;

    if (type === 'user.created' || type === 'user.updated') {
      try {
        // Centralizado no UseCase protegido por regras de negócio!
        await syncUserUseCase.execute({ email, name, clerkId });
        console.log(`💾 Usuário sincronizado via Webhook Clerk!`);
        return reply.status(200).send({ success: true });
      } catch (error) {
        console.error(`❌ Erro na sincronização do webhook:`, error);
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
    
    if (type === 'user.deleted') {
      console.log(`🗑️ Usuário deletado: ${data.id}`);
      
      // 👈 DELETAR DO SUPABASE
      try {
        await prisma.users.deleteMany({
          where: { clerkId: data.id },
        });
        console.log(`   💾 Removido do banco de dados!`);
      } catch (error) {
        console.error(`   ❌ Erro ao deletar:`, error);
      }
    }
    
    return reply.send({ received: true, timestamp: new Date().toISOString() });
  });
}