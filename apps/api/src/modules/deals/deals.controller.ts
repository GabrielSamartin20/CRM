import { FastifyReply, FastifyRequest } from 'fastify';
import { DealsService } from './deals.service';
import { createDealSchema, listDealsQuerySchema, moveDealSchema, updateDealSchema } from './deals.schema';

export class DealsController {
  constructor(private readonly service: DealsService = new DealsService()) {}

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listDealsQuerySchema.parse(request.query) as {
      pipelineId?: string;
      stageId?: string;
      assigneeId?: string;
      contactId?: string;
      channel?: string;
      search?: string;
      page: number;
      limit: number;
    };
    reply.code(200).send(this.service.list(request.user!.workspaceId, query));
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = createDealSchema.parse(request.body) as {
      title: string;
      contactId: string;
      pipelineId: string;
      stageId: string;
      value?: number;
      currency: string;
      expectedCloseDate?: string;
      assigneeId?: string;
      description?: string;
      tags: string[];
    };

    const deal = this.service.create(request.user!.workspaceId, request.user!.id, body);
    reply.code(201).send(deal);
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as { id: string };
    reply.code(200).send(this.service.getById(request.user!.workspaceId, params.id));
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as { id: string };
    const body = updateDealSchema.parse(request.body) as {
      title?: string;
      contactId?: string;
      pipelineId?: string;
      assigneeId?: string;
      value?: number;
      currency?: string;
      expectedCloseDate?: string;
      description?: string;
      tags?: string[];
    };

    reply.code(200).send(this.service.update(request.user!.workspaceId, params.id, body));
  }

  async move(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as { id: string };
    const body = moveDealSchema.parse(request.body) as { stageId: string; reason?: string };
    const moved = await this.service.move(request.user!.workspaceId, params.id, body, request.user!.id);
    reply.code(200).send(moved);
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as { id: string };
    this.service.softDelete(request.user!.workspaceId, params.id);
    reply.code(200).send({ ok: true });
  }
}
