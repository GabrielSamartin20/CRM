import { FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../../plugins/authenticate';
import { verifyMetaSignature } from '../whatsapp/whatsapp.crypto';
import { env } from '../../lib/env';
import { attributionSchema, analyticsQuerySchema } from './attribution.schema';
import { AttributionService } from './attribution.service';
import { metaLeadsInboundQueue } from './attribution.queue';

const clientIp = (request: FastifyRequest): string => {
  const xff = request.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return request.ip ?? '127.0.0.1';
};

export class AttributionController {
  constructor(private readonly service: AttributionService = new AttributionService()) {}

  async ingest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const workspaceTokenHeader = request.headers['x-workspace-token'];
    const workspaceToken = typeof workspaceTokenHeader === 'string' ? workspaceTokenHeader : undefined;
    const workspaceId = await this.service.resolveWorkspaceByPublicToken(workspaceToken);

    const body = attributionSchema.parse(request.body) as {
      phone?: string;
      email?: string;
      name?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
      utmTerm?: string;
      gclid?: string;
      fbclid?: string;
      referrer?: string;
      landingPage?: string;
      sessionId?: string;
      touchType?: 'first' | 'last';
    };

    const result = await this.service.ingest({ workspaceId, payload: body, ip: clientIp(request) });
    reply.code(200).send(result);
  }

  async getByContact(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await authenticate(request, reply);
    const params = request.params as { contactId: string };
    const payload = this.service.getByContact(request.user!.workspaceId, params.contactId);
    reply.code(200).send(payload);
  }

  async analytics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await authenticate(request, reply);
    const query = analyticsQuerySchema.parse(request.query) as { from?: string; to?: string; channel?: string; campaignName?: string };
    const data = await this.service.analytics(request.user!.workspaceId, query);
    reply.code(200).send(data);
  }

  async metaLeadsWebhook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const signature = request.headers['x-hub-signature-256'];
    const signatureString = typeof signature === 'string' ? signature : undefined;
    const raw = request.rawBody ?? '';

    if (!verifyMetaSignature(raw, signatureString, env.META_APP_SECRET || env.WHATSAPP_APP_SECRET)) {
      reply.code(401).send({ error: { code: 'INVALID_SIGNATURE', message: 'Assinatura inválida' } });
      return;
    }

    const body = request.body as {
      entry?: Array<{ changes?: Array<{ field?: string; value?: { leadgen_id?: string; page_id?: string; form_id?: string; adgroup_id?: string; ad_id?: string; created_time?: string } }> }>;
    };

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === 'leadgen' && change.value) {
          await metaLeadsInboundQueue.add('meta-lead', { value: change.value });
        }
      }
    }

    reply.code(200).send({ ok: true });
  }
}
