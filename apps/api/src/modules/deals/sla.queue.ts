import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../lib/env';
import { SocketGateway } from '../../events/socket.gateway';
import { kanbanStore } from './deals.service';
import { getDealSlaStatus } from './sla.service';

const redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });

const noopSocketGateway: SocketGateway = {
  io: null as never,
  emitToWorkspace: () => undefined
};

export const dealSlaQueue = new Queue<{ trigger: 'hourly' }>('deal-sla-hourly', {
  connection: redis
});

export const scheduleDealSlaCron = async (): Promise<void> => {
  await dealSlaQueue.add('scan-deals', { trigger: 'hourly' }, { repeat: { pattern: '0 * * * *' } });
};

export const startDealSlaWorker = (socketGateway: SocketGateway = noopSocketGateway): Worker<{ trigger: 'hourly' }> => {
  return new Worker(
    'deal-sla-hourly',
    async () => {
      const deals = Array.from(kanbanStore.deals.values()).filter((deal) => !deal.deletedAt && deal.status === 'OPEN');
      for (const deal of deals) {
        const stage = kanbanStore.stages.get(deal.stageId);
        if (!stage) continue;
        const sla = getDealSlaStatus({ stageEnteredAt: deal.stageEnteredAt, stage: { slaHours: stage.slaHours } });
        if (sla.status === 'critical' || sla.status === 'overdue') {
          socketGateway.emitToWorkspace('deal:sla_alert', deal.workspaceId, { dealId: deal.id, assigneeId: deal.assigneeId ?? null });
          kanbanStore.timelines.push({
            id: `sla-${deal.id}-${Date.now()}`,
            workspaceId: deal.workspaceId,
            contactId: deal.contactId,
            dealId: deal.id,
            event: 'deal_sla_alert',
            status: sla.status,
            createdAt: new Date().toISOString()
          });
        }
      }
    },
    { connection: redis }
  );
};
