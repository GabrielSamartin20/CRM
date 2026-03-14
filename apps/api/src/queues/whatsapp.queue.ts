import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../lib/env';
import { MetaWebhookEntry, MetaWebhookChangeValue } from '../modules/whatsapp/whatsapp.types';

const redisConnection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });

export interface WhatsAppInboundJob {
  workspaceId?: string;
  entry: MetaWebhookEntry;
  changeValue: MetaWebhookChangeValue;
  changeField: string;
}

export interface WhatsAppOutboundRetryJob {
  workspaceId: string;
  request: {
    phoneNumberId: string;
    payload: Record<string, unknown>;
  };
}

export const whatsappInboundQueue = new Queue<WhatsAppInboundJob>('whatsapp-inbound', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 1000,
    removeOnFail: 1000
  }
});

export const whatsappOutboundQueue = new Queue<WhatsAppOutboundRetryJob>('whatsapp-outbound', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 1000,
    removeOnFail: 1000
  }
});
