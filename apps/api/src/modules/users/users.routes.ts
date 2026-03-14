import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/authenticate';
import { authorize } from '../../plugins/authorize';
import { UsersService } from './users.service';
import { acceptInviteSchema, changePasswordSchema, inviteSchema, listUsersSchema, updateMeSchema, updateRoleSchema } from './users.schema';

export const usersRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const service = new UsersService();

  app.get('/api/v1/users/me', { preHandler: [authenticate] }, async (request) => service.getMe(request.user!.id));

  app.patch('/api/v1/users/me', { preHandler: [authenticate] }, async (request) => {
    const body = updateMeSchema.parse(request.body) as { name?: string; avatarUrl?: string };
    return service.updateMe(request.user!.id, body);
  });

  app.patch('/api/v1/users/me/password', { preHandler: [authenticate] }, async (request) => {
    const body = changePasswordSchema.parse(request.body) as { currentPassword: string; newPassword: string };
    await service.changePassword(request.user!.id, body.currentPassword, body.newPassword);
    return { ok: true };
  });

  app.get('/api/v1/users', { preHandler: [authenticate, authorize('ADMIN', 'MANAGER')] }, async (request) => {
    const query = listUsersSchema.parse(request.query) as { page: number; limit: number };
    return service.list(request.user!.workspaceId, query.page, query.limit);
  });

  app.post('/api/v1/users/invite', { preHandler: [authenticate, authorize('ADMIN')] }, async (request) => {
    const body = inviteSchema.parse(request.body) as { email: string; role: 'ADMIN' | 'MANAGER' | 'AGENT'; name?: string };
    return service.invite(request.user!.workspaceId, body);
  });

  app.post('/api/v1/users/accept-invite', async (request) => {
    const body = acceptInviteSchema.parse(request.body) as { token: string; password: string; name: string };
    return service.acceptInvite(body);
  });

  app.patch('/api/v1/users/:id/role', { preHandler: [authenticate, authorize('ADMIN')] }, async (request) => {
    const params = request.params as { id: string };
    const body = updateRoleSchema.parse(request.body) as { role: 'ADMIN' | 'MANAGER' | 'AGENT' };
    return service.updateRole(request.user!.id, params.id, body.role);
  });

  app.delete('/api/v1/users/:id', { preHandler: [authenticate, authorize('ADMIN')] }, async (request) => {
    const params = request.params as { id: string };
    await service.softDelete(params.id);
    return { ok: true };
  });
};
