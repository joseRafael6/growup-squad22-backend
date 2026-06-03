import { FastifyRequest, FastifyReply } from "fastify";
import { authMiddleware } from "./auth.middleware";

export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Primeiro autentica
  await authMiddleware(request, reply);
  if (reply.sent) return;

  const user = (request as any).user;
  // Verifica se o usuário tem papel de admin (via public_metadata do Clerk)
  const role = user?.role;
  if (role !== "admin") {
    return reply.status(403).send({ message: "Acesso negado. Requer privilégios de administrador." });
  }
}