import { FastifyRequest, FastifyReply } from 'fastify'; 
import { AdminQuestionUseCase } from '../../../core/use-case/AdminQuestionUseCase'; 


export class AdminQuestionController {
  constructor(private adminQuestionUseCase: AdminQuestionUseCase) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any; // Dados enviados
    const result = await this.adminQuestionUseCase.create(body); // Cria questão
    return reply.status(201).send(result); // Retorna criado
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }; // ID da questão
    const body = request.body as any; // Dados atualizados
    const result = await this.adminQuestionUseCase.update(id, body); // Atualiza questão
    return reply.status(200).send(result); // Retorna atualizado
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }; // ID da questão
    await this.adminQuestionUseCase.delete(id); // Remove questão
    return reply.status(204).send(); // Retorna sem conteúdo
  }
}