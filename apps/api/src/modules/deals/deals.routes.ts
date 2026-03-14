import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/authenticate';
import { workspaceGuard } from '../../plugins/workspace-guard';
import { authorize } from '../../plugins/authorize';
import { DealsController } from './deals.controller';

export const dealsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const controller = new DealsController();

  app.get('/api/v1/deals', { preHandler: [authenticate, workspaceGuard] }, async (request, reply) => controller.list(request, reply));
  app.post('/api/v1/deals', { preHandler: [authenticate, workspaceGuard] }, async (request, reply) => controller.create(request, reply));
  app.get('/api/v1/deals/:id', { preHandler: [authenticate, workspaceGuard] }, async (request, reply) => controller.getById(request, reply));
  app.patch('/api/v1/deals/:id', { preHandler: [authenticate, workspaceGuard] }, async (request, reply) => controller.update(request, reply));
  app.patch('/api/v1/deals/:id/move', { preHandler: [authenticate, workspaceGuard] }, async (request, reply) => controller.move(request, reply));
  app.delete('/api/v1/deals/:id', { preHandler: [authenticate, workspaceGuard, authorize('ADMIN', 'MANAGER')] }, async (request, reply) =>
    controller.remove(request, reply)
  );
};
