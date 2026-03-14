import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/authenticate';
import { workspaceGuard } from '../../plugins/workspace-guard';
import { authorize } from '../../plugins/authorize';
import { createPipelineSchema, reorderPipelinesSchema, updatePipelineSchema } from './pipelines.schema';
import { PipelinesService } from './pipelines.service';

export const pipelinesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const service = new PipelinesService();

  app.get('/api/v1/pipelines', { preHandler: [authenticate, workspaceGuard] }, async (request: import('fastify').FastifyRequest) => {
    return service.list(request.user!.workspaceId);
  });

  app.post('/api/v1/pipelines', { preHandler: [authenticate, workspaceGuard] }, async (request: import('fastify').FastifyRequest) => {
    const body = createPipelineSchema.parse(request.body) as { name: string; description?: string };
    return service.create(request.user!.workspaceId, body);
  });

  app.put('/api/v1/pipelines/:id', { preHandler: [authenticate, workspaceGuard] }, async (request: import('fastify').FastifyRequest) => {
    const params = request.params as { id: string };
    const body = updatePipelineSchema.parse(request.body) as { name?: string; description?: string };
    return service.update(request.user!.workspaceId, params.id, body);
  });

  app.delete('/api/v1/pipelines/:id', { preHandler: [authenticate, workspaceGuard, authorize('ADMIN')] }, async (request: import('fastify').FastifyRequest) => {
    const params = request.params as { id: string };
    service.softDelete(request.user!.workspaceId, params.id);
    return { ok: true };
  });

  app.patch('/api/v1/pipelines/reorder', { preHandler: [authenticate, workspaceGuard] }, async (request: import('fastify').FastifyRequest) => {
    const body = reorderPipelinesSchema.parse(request.body) as { pipelines: Array<{ id: string; order: number }> };
    return service.reorder(request.user!.workspaceId, body);
  });
};
