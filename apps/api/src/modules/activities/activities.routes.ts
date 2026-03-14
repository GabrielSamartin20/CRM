import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/authenticate';
import { workspaceGuard } from '../../plugins/workspace-guard';
import { ActivitiesService } from './activities.service';
import { createActivitySchema, updateActivitySchema } from './activities.schema';

export const activitiesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const service = new ActivitiesService();

  app.get('/api/v1/deals/:dealId/activities', { preHandler: [authenticate, workspaceGuard] }, async (request) => {
    const params = request.params as { dealId: string };
    return service.list(request.user!.workspaceId, params.dealId);
  });

  app.post('/api/v1/deals/:dealId/activities', { preHandler: [authenticate, workspaceGuard] }, async (request) => {
    const params = request.params as { dealId: string };
    const body = createActivitySchema.parse(request.body) as {
      type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'task' | 'note';
      title: string;
      description?: string;
      scheduledAt?: string;
      dueAt?: string;
      assigneeId?: string;
    };
    return service.create(request.user!.workspaceId, params.dealId, body);
  });

  app.patch('/api/v1/deals/:dealId/activities/:id', { preHandler: [authenticate, workspaceGuard] }, async (request) => {
    const params = request.params as { dealId: string; id: string };
    const body = updateActivitySchema.parse(request.body) as {
      type?: 'call' | 'email' | 'whatsapp' | 'meeting' | 'task' | 'note';
      title?: string;
      description?: string;
      scheduledAt?: string;
      dueAt?: string;
      assigneeId?: string;
      status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    };
    return service.update(request.user!.workspaceId, params.dealId, params.id, body);
  });

  app.delete('/api/v1/deals/:dealId/activities/:id', { preHandler: [authenticate, workspaceGuard] }, async (request) => {
    const params = request.params as { dealId: string; id: string };
    service.remove(request.user!.workspaceId, params.dealId, params.id);
    return { ok: true };
  });
};
