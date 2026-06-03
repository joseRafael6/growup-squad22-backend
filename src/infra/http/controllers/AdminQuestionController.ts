import { FastifyRequest, FastifyReply } from "fastify";
import { CreateQuestionUseCase } from "../../../core/use-case/admin/CreateQuestionUseCase";
import { UpdateQuestionUseCase } from "../../../core/use-case/admin/UpdateQuestionUseCase";
import { DeleteQuestionUseCase } from "../../../core/use-case/admin/DeleteQuestionUseCase";
import { ListQuestionsUseCase } from "../../../core/use-case/admin/ListQuestionsUseCase";

export class AdminQuestionController {
  constructor(
    private listQuestions: ListQuestionsUseCase,
    private createQuestion: CreateQuestionUseCase,
    private updateQuestion: UpdateQuestionUseCase,
    private deleteQuestion: DeleteQuestionUseCase
  ) {}

  async list(request: FastifyRequest, reply: FastifyReply) {
    const questions = await this.listQuestions.execute();
    return reply.send(questions);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as any;
    const question = await this.createQuestion.execute(data);
    return reply.status(201).send(question);
  }

  async update(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const data = request.body as any;
    const question = await this.updateQuestion.execute(id, data);
    return reply.send(question);
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    await this.deleteQuestion.execute(id);
    return reply.status(204).send();
  }
}