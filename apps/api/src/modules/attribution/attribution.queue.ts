import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../lib/env';
import { AttributionService } from './attribution.service';
import { authStore } from '../auth/auth.service';

const redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });

export const metaLeadsInboundQueue = new Queue<{ value: { leadgen_id?: string; form_id?: string; adgroup_id?: string; ad_id?: string } }>('meta-leads-inbound', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
});

export const googleConversionsQueue = new Queue<{ workspaceId: string; contactId: string; conversionName: string; conversionValue: number; conversionTime: string }>(
  'google-conversions',
  { connection: redis }
);

export const startMetaLeadsWorker = (): Worker<{ value: { leadgen_id?: string; form_id?: string; adgroup_id?: string; ad_id?: string } }> => {
  const service = new AttributionService();

  return new Worker(
    'meta-leads-inbound',
    async (job) => {
      const leadgenId = job.data.value.leadgen_id;
      if (!leadgenId) return;

      const response = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?fields=field_data&access_token=${env.META_PAGE_TOKEN}`);
      const payload = (await response.json()) as { field_data?: Array<{ name?: string; values?: string[] }> };

      const phone = payload.field_data?.find((field) => field.name === 'phone_number')?.values?.[0];
      const email = payload.field_data?.find((field) => field.name === 'email')?.values?.[0];

      const firstToken = Array.from(authStore.workspacePublicTokens.keys())[0];
      if (!firstToken) return;
      const workspaceId = await service.resolveWorkspaceByPublicToken(firstToken);

      await service.ingest({
        workspaceId,
        payload: {
          phone,
          email,
          fbclid: job.data.value.adgroup_id,
          utmCampaign: job.data.value.form_id,
          utmContent: job.data.value.ad_id,
          touchType: 'last'
        },
        ip: '127.0.0.1'
      });
    },
    { connection: redis }
  );
};
