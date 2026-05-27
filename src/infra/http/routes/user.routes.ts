import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { SyncUserUseCase } from "../../../core/use-case/sync-user.usecase";
import { SupabaseUserRepository } from "../../database/SupabaseUserRepository";
import { prisma } from "../../database/prisma.client";

interface SyncUserBody {
  email: string;
  name?: string;
  clerkId: string;
}

function isValidEmail(email: string): boolean {
  // Exige formato: letras/números/símbolos @ domínio . extensão com 2+ letras
  // Rejeita: "abc@abc.a", "texto puro", "123", espaços, etc.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export async function userRoutes(fastify: FastifyInstance) {
  
  fastify.get("/health", async () => {
    return { status: "OK", timestamp: new Date().toISOString() };
  });

  fastify.get("/test-db", async () => {
    const users = await prisma.users.findMany();
    return { count: users.length, users };
  });

  fastify.post("/users/sync", async (
    request: FastifyRequest<{ Body: SyncUserBody }>,
    reply: FastifyReply
  ) => {
    try {
      let { email, name, clerkId } = request.body;

      // 1. Campos obrigatórios
      if (!email || email.trim() === "") {
        return reply.status(400).send({ error: "Email é obrigatório e não pode estar em branco" });
      }

      if (!clerkId || clerkId.trim() === "") {
        return reply.status(400).send({ error: "clerkId é obrigatório" });
      }

      // 2. Limpar espaços das bordas
      email = email.trim();

      // 3. Validar formato de email
      if (!isValidEmail(email)) {
        return reply.status(400).send({ 
          error: "Formato de email inválido. Exemplo: usuario@email.com" 
        });
      }

      // 4. Verificar se o email já está cadastrado com outro clerkId
      const userRepository = new SupabaseUserRepository();
      const existingUser = await userRepository.findByEmail(email);

      if (existingUser) {
          return reply.status(409).send({ 
            error: "Este e-mail já está cadastrado. Tente fazer login." 
          });
      }

      // 5. Sincronizar
      const syncUserUseCase = new SyncUserUseCase(userRepository);
      const { user, created } = await syncUserUseCase.execute({ 
        email, 
        name: name?.trim(),
        clerkId
      });
      
      return reply.status(created ? 201 : 200).send({ user });
      
    } catch (error: any) {
      // Segurança: caso a constraint unique do banco seja violada por race condition
      if (error.code === "P2002") {
        return reply.status(409).send({ error: "Este e-mail já está cadastrado" });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: "Erro interno do servidor" });
    }
  });
}