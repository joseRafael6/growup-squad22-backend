// infra/http/middlewares/auth.middleware.ts
// RESPONSABILIDADE: Autenticação via token JWT do Clerk.
//
// Valida o token Bearer no header Authorization.
// Se ausente ou inválido, bloqueia com 401 Unauthorized.

import { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "@clerk/backend";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({ message: "Token ausente" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    // Verifica o token JWT usando o SDK do Clerk.
    // CLERK_SECRET_KEY é obrigatória no .env.
    // CLERK_JWT_KEY (chave pública PEM) é opcional mas melhora a performance
    // pois permite verificação local sem chamada de rede.
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      // issuer é resolvido automaticamente pelo secretKey
      jwtKey: process.env.CLERK_JWT_KEY,
    } as any);

    // Disponibiliza o payload nos controllers via request.user
    (request as any).user = payload;
  } catch (err) {
    return reply.status(401).send({ message: "Token inválido" });
  }
}
