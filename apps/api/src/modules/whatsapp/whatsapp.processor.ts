import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { SocketGateway } from '../../events/socket.gateway';
import { env } from '../../lib/env';
import { DataRepository } from '../../lib/repositories';
import { WhatsAppInboundJob } from '../../queues/whatsapp.queue';
import { WhatsAppService } from './whatsapp.service';

export interface WhatsAppInboundProcessor {
  handle(job: Job<WhatsAppInboundJob>): Promise<void>;
}

export const createWhatsAppInboundProcessor = (deps: {
  repository: DataRepository;
  socketGateway: SocketGateway;
}): WhatsAppInboundProcessor => {
  const service = new WhatsAppService({ repository: deps.repository, socketGateway: deps.socketGateway });

  return {
    async handle(job: Job<WhatsAppInboundJob>): Promise<void> {
      const value = job.data.changeValue;
      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId) {
        return;
      }

      const workspace = await deps.repository.findWorkspaceByPhoneNumberId(phoneNumberId);
      if (!workspace) {
        return;
      }

      if (value.messages && value.messages.length > 0) {
        await service.processInboundMessages({
          workspaceId: workspace.workspaceId,
          contacts: value.contacts ?? [],
          messages: value.messages
        });
      }

      if (value.statuses && value.statuses.length > 0) {
        for (const status of value.statuses) {
          await service.processStatusUpdate({ workspaceId: workspace.workspaceId, status });
        }
      }
    }
  };
};

export const startWhatsAppInboundWorker = (deps: {
  repository: DataRepository;
  socketGateway: SocketGateway;
}): Worker<WhatsAppInboundJob> => {
  const redisConnection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const processor = createWhatsAppInboundProcessor(deps);

  return new Worker<WhatsAppInboundJob>('whatsapp-inbound', (job) => processor.handle(job), {
    connection: redisConnection
  });
};
