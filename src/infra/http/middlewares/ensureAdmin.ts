import { FastifyRequest, FastifyReply } from 'fastify'; 
import { AppError } from '../../../shared/errors/AppError'; // Classe de erro da aplicação

export async function ensureAdmin(request: FastifyRequest, reply: FastifyReply) { // Middleware de admin
  const user = (request as any).user; // Dados do usuário

  if (!user || user.role !== 'admin') { // Verifica se é admin
    throw new AppError('Acesso negado. Rota exclusiva para administradores.', 403); // Bloqueia acesso
  }
}