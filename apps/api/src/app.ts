import Fastify from 'fastify';
import { createSocketGateway, SocketGateway } from './events/socket.gateway';
import { logger } from './lib/logger';
import { registerErrorHandler } from './lib/errors';
import { globalRateLimit } from './plugins/rate-limit';
import { registerSwagger } from './plugins/swagger';
import { InMemoryRepository } from './lib/repositories';
import { conversationsRoutes } from './modules/conversations/conversations.routes';
import { ConversationsService } from './modules/conversations/conversations.service';
import { whatsappRoutes } from './modules/whatsapp/whatsapp.routes';
import { WhatsAppService } from './modules/whatsapp/whatsapp.service';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { workspacesRoutes } from './modules/workspaces/workspaces.routes';
import { attributionRoutes } from './modules/attribution/attribution.routes';
import { pipelinesRoutes } from './modules/pipelines/pipelines.routes';
import { stagesRoutes } from './modules/stages/stages.routes';
import { dealsRoutes } from './modules/deals/deals.routes';
import { activitiesRoutes } from './modules/activities/activities.routes';

const createNoopSocketGateway = (): SocketGateway => ({
  io: null as never,
  emitToWorkspace: () => undefined
});

export const buildApp = (options?: {
  repository?: InMemoryRepository;
  socketGateway?: SocketGateway;
  withSocketServer?: boolean;
}) => {
  const app = Fastify({ logger: false });
  const repository = options?.repository ?? new InMemoryRepository();

  const socketGateway = options?.socketGateway ?? (options?.withSocketServer ? createSocketGateway(app.server) : createNoopSocketGateway());

  const whatsappService = new WhatsAppService({ repository, socketGateway });
  const convService = new ConversationsService({ repository, whatsappService, socketGateway });

  app.addHook('onRequest', globalRateLimit);

  app.register(authRoutes);
  app.register(usersRoutes);
  app.register(workspacesRoutes);
  app.register(whatsappRoutes);
  app.register(attributionRoutes);
  app.register(pipelinesRoutes);
  app.register(stagesRoutes);
  app.register(dealsRoutes);
  app.register(activitiesRoutes);
  app.register(conversationsRoutes(convService));

  registerErrorHandler(app);
  void registerSwagger(app);

  logger.info({}, 'App bootstrap completed');
  return app;
};
