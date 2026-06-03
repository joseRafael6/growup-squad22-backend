import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { SyncUserUseCase } from "../../../core/use-case/sync-user.usecase";
import { SupabaseUserRepository } from "../../database/SupabaseUserRepository";
import { prisma } from "../../database/prisma.client";

interface SyncUserBody {
  email: string;
  name?: string;
  clerkId: string;
  // Novos campos de perfil
  companyName?: string;
  sector?: string;
  // Código de convite para vincular à empresa do sistema
  inviteCode?: string;
}

function isValidEmail(email: string): boolean {
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
      let { email, name, clerkId, companyName, sector, inviteCode } = request.body;

      // 1. Campos obrigatórios
      if (!email || email.trim() === "") {
        return reply.status(400).send({ error: "Email é obrigatório e não pode estar em branco" });
      }
      if (!clerkId || clerkId.trim() === "") {
        return reply.status(400).send({ error: "clerkId é obrigatório" });
      }

      email = email.trim();

      // 2. Validar formato de email
      if (!isValidEmail(email)) {
        return reply.status(400).send({
          error: "Formato de email inválido. Exemplo: usuario@email.com"
        });
      }

      // 3. Verificar duplicidade de email
      const userRepository = new SupabaseUserRepository();
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return reply.status(409).send({
          error: "Este e-mail já está cadastrado. Tente fazer login."
        });
      }

      // 4. Validar código de convite (se fornecido)
      let companyId: string | null = null;
      if (inviteCode && inviteCode.trim() !== "") {
        const company = await prisma.company.findUnique({
          where: { inviteCode: inviteCode.trim().toUpperCase() }
        });
        if (!company) {
          return reply.status(400).send({
            error: "Código de convite inválido. Verifique o código e tente novamente."
          });
        }
        companyId = company.id;
      }

      // 5. Sincronizar usuário
      const syncUserUseCase = new SyncUserUseCase(userRepository);
      const { user, created } = await syncUserUseCase.execute({
        email,
        name: name?.trim(),
        clerkId,
        companyName: companyName?.trim(),
        sector: sector?.trim(),
      });

      // 6. Vincular à empresa se código válido
      if (companyId && user) {
        await prisma.company_member.upsert({
          where: {
            userId_companyId: { userId: user.id, companyId }
          },
          update: {},
          create: { userId: user.id, companyId }
        });
      }

      // 7. Retornar dados completos incluindo empresa vinculada
      const companyInfo = companyId
        ? await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, topic: true } })
        : null;

      return reply.status(created ? 201 : 200).send({
        user,
        company: companyInfo ?? null,
      });

    } catch (error: any) {
      if (error.code === "P2002") {
        return reply.status(409).send({ error: "Este e-mail já está cadastrado" });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: "Erro interno do servidor" });
    }
  });

  // GET /users/me — retorna dados do usuário autenticado + empresa vinculada
  fastify.get("/users/me", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply.status(401).send({ error: "Token ausente" });
      }

      const { verifyToken } = await import("@clerk/backend");
      const token = authHeader.replace("Bearer ", "").trim();
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
        jwtKey: process.env.CLERK_JWT_KEY,
      } as any);

      const clerkId = payload.sub;
      const user = await prisma.users.findUnique({
        where: { clerkId },
        include: {
          memberships: {
            include: {
              company: { select: { id: true, name: true, topic: true } }
            }
          },
          companyAdmins: {
            include: {
              company: { select: { id: true, name: true } }
            }
          }
        }
      });

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado. Sincronize primeiro." });
      }

      return reply.send({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        sector: user.sector,
        // Empresas onde é membro comum
        companies: user.memberships.map(m => m.company),
        // Empresas onde é admin
        adminOf: user.companyAdmins.map(a => a.company),
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(401).send({ error: "Token inválido" });
    }
  });
}
