// infra/http/controllers/user.controller.ts
// ATENÇÃO: Este arquivo não é utilizado pelo main.ts.
// A lógica de sync de usuário está em user.routes.ts.
// Mantido apenas para referência.

import { FastifyRequest, FastifyReply } from "fastify";
import { SupabaseUserRepository } from "../../database/SupabaseUserRepository";
import { SyncUserUseCase } from "../../../core/use-case/sync-user.usecase";

export async function syncUserController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { email, name, clerkId } = request.body as {
    email: string;
    name?: string;
    clerkId: string;
  };

  if (!clerkId) {
    return reply.status(400).send({ message: "clerkId é obrigatório" });
  }

  const repo = new SupabaseUserRepository();
  const useCase = new SyncUserUseCase(repo);

  try {
    const { user, created } = await useCase.execute({ email, name, clerkId });
    return reply.status(created ? 201 : 200).send(user);
  } catch (error: any) {
    if (error.code === "P2002") {
      return reply.status(409).send({ message: "E-mail já cadastrado" });
    }
    return reply.status(500).send({ message: "Erro interno" });
  }
}
