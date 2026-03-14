import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/authenticate';
import { workspaceGuard } from '../../plugins/workspace-guard';
import {
  assignConversationSchema,
  conversationStatusSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
  sendConversationMessageSchema
} from './conversations.schema';
import { ConversationsService } from './conversations.service';

export const conversationsRoutes = (service: ConversationsService): FastifyPluginAsync => {
  return async (app: FastifyInstance) => {
    app.addHook('preHandler', authenticate);
    app.addHook('preHandler', workspaceGuard);

    app.get('/api/v1/conversations', async (request) => {
      const query = listConversationsQuerySchema.parse(request.query) as { status?: "open" | "pending" | "resolved" | "spam"; agentId?: string; channel?: string; page: number; limit: number };
      const workspaceId = request.user!.workspaceId;
      return service.list(workspaceId, query);
    });

    app.get('/api/v1/conversations/:id', async (request) => {
      const params = request.params as { id: string };
      return service.getById(request.user!.workspaceId, params.id);
    });

    app.get('/api/v1/conversations/:id/messages', async (request) => {
      const params = request.params as { id: string };
      const query = listMessagesQuerySchema.parse(request.query) as { cursor?: string; limit: number };
      return service.listMessages(request.user!.workspaceId, params.id, query);
    });

    app.post('/api/v1/conversations/:id/messages', async (request) => {
      const params = request.params as { id: string };
      const body = sendConversationMessageSchema.parse(request.body) as { type: "text" | "template" | "media"; content: Record<string, unknown> };
      return service.sendMessage(request.user!.workspaceId, params.id, body);
    });

    app.patch('/api/v1/conversations/:id/assign', async (request) => {
      const params = request.params as { id: string };
      const body = assignConversationSchema.parse(request.body) as { agentId: string };
      return service.assign(request.user!.workspaceId, params.id, body.agentId);
    });

    app.patch('/api/v1/conversations/:id/status', async (request) => {
      const params = request.params as { id: string };
      const body = conversationStatusSchema.parse(request.body) as { status: "open" | "pending" | "resolved" | "spam" };
      return service.changeStatus(request.user!.workspaceId, params.id, body.status);
    });
  };
};
