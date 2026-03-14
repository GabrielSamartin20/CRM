import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AttributionController } from './attribution.controller';

export const attributionRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const controller = new AttributionController();

  app.addContentTypeParser('application/json', { parseAs: 'string' }, (request, body, done) => {
    request.rawBody = body;
    try {
      done(null, JSON.parse(body));
    } catch (error) {
      done(error as Error, undefined);
    }
  });

  app.post('/api/v1/attribution', (request, reply) => controller.ingest(request, reply));
  app.get('/api/v1/attribution/:contactId', (request, reply) => controller.getByContact(request, reply));
  app.get('/api/v1/analytics/attribution', (request, reply) => controller.analytics(request, reply));
  app.post('/api/v1/webhooks/meta-leads', (request, reply) => controller.metaLeadsWebhook(request, reply));
};
