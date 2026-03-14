import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/authenticate';
import { authorize } from '../../plugins/authorize';
import { workspaceGuard } from '../../plugins/workspace-guard';
import { WorkspacesService } from './workspaces.service';
import { updateWorkspaceSchema } from './workspaces.schema';

export const workspacesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const service = new WorkspacesService();

  app.get('/api/v1/workspaces/current', { preHandler: [authenticate] }, async (request) => {
    return service.current(request.user!.workspaceId);
  });

  app.patch('/api/v1/workspaces/current', { preHandler: [authenticate, authorize('ADMIN')] }, async (request) => {
    const body = updateWorkspaceSchema.parse(request.body) as {
      name?: string;
      logoUrl?: string;
      timezone?: string;
      currency?: string;
      language?: string;
    };
    return service.update(request.user!.workspaceId, body);
  });

  app.get('/api/v1/workspaces/current/members', { preHandler: [authenticate] }, async (request) => {
    return service.members(request.user!.workspaceId);
  });

  app.get('/api/v1/workspaces/:workspaceId/members', { preHandler: [authenticate, workspaceGuard] }, async (request) => {
    const params = request.params as { workspaceId: string };
    return service.members(params.workspaceId);
  });

  app.get('/api/v1/workspaces/current/public-token', { preHandler: [authenticate] }, async (request) => {
    return service.publicToken(request.user!.workspaceId);
  });

  app.post('/api/v1/workspaces/current/public-token/rotate', { preHandler: [authenticate, authorize('ADMIN')] }, async (request) => {
    return service.rotatePublicToken(request.user!.workspaceId);
  });

  app.delete('/api/v1/workspaces/current/members/:userId', { preHandler: [authenticate, authorize('ADMIN')] }, async (request) => {
    const params = request.params as { userId: string };
    await service.removeMember(request.user!.workspaceId, request.user!.id, params.userId);
    return { ok: true };
  });
};
