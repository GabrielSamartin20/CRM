import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../errors/app-error';
import { env } from '../../lib/env';
import { whatsappInboundQueue } from '../../queues/whatsapp.queue';
import { verifyMetaSignature } from './whatsapp.crypto';
import { whatsappVerificationQuerySchema, whatsappWebhookPayloadSchema } from './whatsapp.schema';

export class WhatsAppController {
  async verifyWebhook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = whatsappVerificationQuerySchema.parse(request.query) as { "hub.mode": string; "hub.verify_token": string; "hub.challenge": string };

    if (query['hub.mode'] !== 'subscribe' || query['hub.verify_token'] !== env.WHATSAPP_VERIFY_TOKEN) {
      reply.code(403).send('Forbidden');
      return;
    }

    reply.type('text/plain').code(200).send(query['hub.challenge']);
  }

  async receiveWebhook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const rawBody = request.rawBody ?? '';
    const signature = request.headers['x-hub-signature-256'];
    const signatureString = typeof signature === 'string' ? signature : undefined;

    const valid = verifyMetaSignature(rawBody, signatureString, env.WHATSAPP_APP_SECRET);
    if (!valid) {
      throw new AppError({ statusCode: 401, code: 'INVALID_SIGNATURE', message: 'Assinatura HMAC inválida' });
    }

    const payload = whatsappWebhookPayloadSchema.parse(request.body) as { entry: Array<{ id: string; changes: Array<{ field: string; value: import('./whatsapp.types').MetaWebhookChangeValue }> }> };

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        await whatsappInboundQueue.add(
          'whatsapp-inbound-event',
          {
            entry,
            changeValue: change.value,
            changeField: change.field
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        );
      }
    }

    reply.code(200).send({ ok: true });
  }
}
