import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { WhatsAppController } from './whatsapp.controller';

export const whatsappRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const controller = new WhatsAppController();

  app.addContentTypeParser('application/json', { parseAs: 'string' }, (request, body, done) => {
    request.rawBody = body;
    try {
      const parsed = JSON.parse(body);
      done(null, parsed);
    } catch (error) {
      done(error as Error, undefined);
    }
  });

  app.get('/api/v1/webhooks/whatsapp', (request, reply) => controller.verifyWebhook(request, reply));
  app.post('/api/v1/webhooks/whatsapp', (request, reply) => controller.receiveWebhook(request, reply));
};
