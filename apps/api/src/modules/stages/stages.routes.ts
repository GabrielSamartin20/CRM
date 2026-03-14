import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/authenticate';
import { workspaceGuard } from '../../plugins/workspace-guard';
import { createStageSchema, reorderStagesSchema, updateStageSchema } from './stages.schema';
import { StagesService } from './stages.service';

export const stagesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const service = new StagesService();

  app.post('/api/v1/pipelines/:pipelineId/stages', { preHandler: [authenticate, workspaceGuard] }, async (request: import('fastify').FastifyRequest) => {
    const params = request.params as { pipelineId: string };
    const body = createStageSchema.parse(request.body) as {
      name: string;
      color: string;
      probability: number;
      order: number;
      slaHours?: number;
      type?: 'OPEN' | 'CLOSED_WON' | 'CLOSED_LOST';
    };
    return service.create(request.user!.workspaceId, params.pipelineId, body);
  });

  app.put('/api/v1/pipelines/:pipelineId/stages/:id', { preHandler: [authenticate, workspaceGuard] }, async (request: import('fastify').FastifyRequest) => {
    const params = request.params as { pipelineId: string; id: string };
    const body = updateStageSchema.parse(request.body) as {
      name?: string;
      color?: string;
      probability?: number;
      order?: number;
      slaHours?: number;
      type?: 'OPEN' | 'CLOSED_WON' | 'CLOSED_LOST';
    };
    return service.update(request.user!.workspaceId, params.pipelineId, params.id, body);
  });

  app.delete('/api/v1/pipelines/:pipelineId/stages/:id', { preHandler: [authenticate, workspaceGuard] }, async (request: import('fastify').FastifyRequest) => {
    const params = request.params as { pipelineId: string; id: string };
    service.remove(request.user!.workspaceId, params.pipelineId, params.id);
    return { ok: true };
  });

  app.patch('/api/v1/pipelines/:pipelineId/stages/reorder', { preHandler: [authenticate, workspaceGuard] }, async (request: import('fastify').FastifyRequest) => {
    const params = request.params as { pipelineId: string };
    const body = reorderStagesSchema.parse(request.body) as { stages: Array<{ id: string; order: number }> };
    return service.reorder(request.user!.workspaceId, params.pipelineId, body);
  });
};
