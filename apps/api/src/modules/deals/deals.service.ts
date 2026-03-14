import { randomUUID } from 'node:crypto';
import { AppError } from '../../lib/errors';
import { SocketGateway } from '../../events/socket.gateway';
import { authStore } from '../auth/auth.service';
import { attributionStore } from '../attribution/attribution.service';
import { GoogleConversionService } from '../attribution/google-conversion.service';
import {
  ActivityRecord,
  DealListItem,
  DealRecord,
  DealStageHistoryRecord,
  PipelineRecord,
  StageRecord
} from './deals.types';
import { getDaysInStage, getDealSlaStatus } from './sla.service';

const noopSocketGateway: SocketGateway = {
  io: null as never,
  emitToWorkspace: () => undefined
};

export const kanbanStore = {
  pipelines: new Map<string, PipelineRecord>(),
  stages: new Map<string, StageRecord>(),
  deals: new Map<string, DealRecord>(),
  stageHistory: new Array<DealStageHistoryRecord>(),
  activities: new Map<string, ActivityRecord>(),
  timelines: new Array<Record<string, unknown>>()
};

export class DealsService {
  constructor(
    private readonly socketGateway: SocketGateway = noopSocketGateway,
    private readonly googleConversionService: GoogleConversionService = new GoogleConversionService()
  ) {}

  private findStage(workspaceId: string, stageId: string): StageRecord {
    const stage = kanbanStore.stages.get(stageId);
    if (!stage || stage.workspaceId !== workspaceId) {
      throw new AppError({ statusCode: 404, code: 'STAGE_NOT_FOUND', message: 'Stage não encontrado' });
    }
    return stage;
  }

  private findDeal(workspaceId: string, dealId: string): DealRecord {
    const deal = kanbanStore.deals.get(dealId);
    if (!deal || deal.workspaceId !== workspaceId || deal.deletedAt) {
      throw new AppError({ statusCode: 404, code: 'DEAL_NOT_FOUND', message: 'Deal não encontrado' });
    }
    return deal;
  }

  list(workspaceId: string, query: { pipelineId?: string; stageId?: string; assigneeId?: string; contactId?: string; channel?: string; search?: string; page: number; limit: number }): {
    items: DealListItem[];
    total: number;
  } {
    const rows = Array.from(kanbanStore.deals.values()).filter((deal) => {
      if (deal.workspaceId !== workspaceId || deal.deletedAt) return false;
      if (query.pipelineId && deal.pipelineId !== query.pipelineId) return false;
      if (query.stageId && deal.stageId !== query.stageId) return false;
      if (query.assigneeId && deal.assigneeId !== query.assigneeId) return false;
      if (query.contactId && deal.contactId !== query.contactId) return false;
      if (query.search && !deal.title.toLowerCase().includes(query.search.toLowerCase())) return false;
      if (query.channel) {
        const attr = attributionStore.attributionByContact.get(`${workspaceId}:${deal.contactId}`);
        if (attr?.channel !== query.channel) return false;
      }
      return true;
    });

    const enriched = rows.map((deal) => {
      const stage = this.findStage(workspaceId, deal.stageId);
      const sla = getDealSlaStatus({ stageEnteredAt: deal.stageEnteredAt, stage: { slaHours: stage.slaHours } });
      const attr = attributionStore.attributionByContact.get(`${workspaceId}:${deal.contactId}`);
      return {
        ...deal,
        channel: attr?.channel ?? null,
        daysInStage: getDaysInStage(deal),
        slaStatus: sla.status
      };
    });

    const start = (query.page - 1) * query.limit;
    return { items: enriched.slice(start, start + query.limit), total: enriched.length };
  }

  create(workspaceId: string, userId: string, input: {
    title: string;
    contactId: string;
    pipelineId: string;
    stageId: string;
    value?: number;
    currency: string;
    expectedCloseDate?: string;
    assigneeId?: string;
    description?: string;
    tags: string[];
  }): DealRecord {
    const stage = this.findStage(workspaceId, input.stageId);
    if (stage.pipelineId !== input.pipelineId) {
      throw new AppError({ statusCode: 400, code: 'STAGE_PIPELINE_MISMATCH', message: 'Stage não pertence ao pipeline' });
    }

    const deal: DealRecord = {
      id: randomUUID(),
      workspaceId,
      title: input.title,
      contactId: input.contactId,
      pipelineId: input.pipelineId,
      stageId: input.stageId,
      assigneeId: input.assigneeId,
      value: input.value,
      currency: input.currency,
      expectedCloseDate: input.expectedCloseDate,
      description: input.description,
      tags: input.tags,
      status: stage.type === 'CLOSED_WON' ? 'CLOSED_WON' : stage.type === 'CLOSED_LOST' ? 'CLOSED_LOST' : 'OPEN',
      stageEnteredAt: new Date(),
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    kanbanStore.deals.set(deal.id, deal);
    kanbanStore.stageHistory.push({
      id: randomUUID(),
      workspaceId,
      dealId: deal.id,
      fromStageId: null,
      toStageId: deal.stageId,
      movedAt: new Date(),
      movedBy: userId
    });

    this.socketGateway.emitToWorkspace('deal:created', workspaceId, { deal });
    return deal;
  }

  getById(workspaceId: string, dealId: string): Record<string, unknown> {
    const deal = this.findDeal(workspaceId, dealId);
    const contact = attributionStore.contacts.get(deal.contactId) ?? null;
    const attribution = attributionStore.attributionByContact.get(`${workspaceId}:${deal.contactId}`) ?? null;
    const activities = Array.from(kanbanStore.activities.values()).filter((activity) => activity.workspaceId === workspaceId && activity.dealId === deal.id);
    const stageHistory = kanbanStore.stageHistory.filter((item) => item.workspaceId === workspaceId && item.dealId === deal.id);
    const timeline = kanbanStore.timelines.filter((entry) => String(entry.dealId) === deal.id && String(entry.workspaceId) === workspaceId);

    return { deal, contact, attribution, activities, stageHistory, timeline };
  }

  update(workspaceId: string, dealId: string, patch: {
    title?: string;
    contactId?: string;
    pipelineId?: string;
    assigneeId?: string;
    value?: number;
    currency?: string;
    expectedCloseDate?: string;
    description?: string;
    tags?: string[];
  }): DealRecord {
    const deal = this.findDeal(workspaceId, dealId);
    const updated: DealRecord = { ...deal, ...patch, updatedAt: new Date() };
    kanbanStore.deals.set(updated.id, updated);
    this.socketGateway.emitToWorkspace('deal:updated', workspaceId, { deal: updated });
    return updated;
  }

  async move(workspaceId: string, dealId: string, input: { stageId: string; reason?: string }, movedBy: string): Promise<DealRecord> {
    const deal = this.findDeal(workspaceId, dealId);
    const fromStage = this.findStage(workspaceId, deal.stageId);
    const toStage = this.findStage(workspaceId, input.stageId);

    const movedAt = new Date();
    const timeInPreviousStageSeconds = Math.floor((movedAt.getTime() - deal.stageEnteredAt.getTime()) / 1000);

    const patch: Partial<DealRecord> = {
      stageId: toStage.id,
      pipelineId: toStage.pipelineId,
      stageEnteredAt: movedAt,
      status: toStage.type === 'CLOSED_WON' ? 'CLOSED_WON' : toStage.type === 'CLOSED_LOST' ? 'CLOSED_LOST' : 'OPEN',
      updatedAt: movedAt
    };

    if (toStage.type === 'CLOSED_WON') {
      patch.wonAt = movedAt;
      patch.actualValue = deal.value;
      await this.googleConversionService.onDealWon({
        workspaceId,
        contactId: deal.contactId,
        conversionName: 'deal_won',
        conversionValue: deal.value ?? 0,
        conversionTime: movedAt.toISOString()
      });
    }

    if (toStage.type === 'CLOSED_LOST') {
      patch.lostAt = movedAt;
      patch.lostReason = input.reason;
    }

    const updated = { ...deal, ...patch } as DealRecord;
    kanbanStore.deals.set(deal.id, updated);

    kanbanStore.stageHistory.push({
      id: randomUUID(),
      workspaceId,
      dealId: deal.id,
      fromStageId: fromStage.id,
      toStageId: toStage.id,
      movedAt,
      movedBy,
      reason: input.reason,
      timeInPreviousStageSeconds
    });

    authStore.auditLogs.push({
      action: 'deal.move',
      userId: movedBy,
      workspaceId,
      entity: 'deal',
      entityId: deal.id,
      fromStageId: fromStage.id,
      toStageId: toStage.id,
      movedAt: movedAt.toISOString()
    });

    kanbanStore.timelines.push({
      id: randomUUID(),
      workspaceId,
      contactId: deal.contactId,
      dealId: deal.id,
      event: 'deal_moved',
      fromStageId: fromStage.id,
      toStageId: toStage.id,
      movedAt: movedAt.toISOString(),
      movedBy
    });

    this.socketGateway.emitToWorkspace('deal:moved', workspaceId, { dealId: deal.id, fromStageId: fromStage.id, toStageId: toStage.id });
    return updated;
  }

  softDelete(workspaceId: string, dealId: string): void {
    const deal = this.findDeal(workspaceId, dealId);
    kanbanStore.deals.set(deal.id, { ...deal, deletedAt: new Date(), updatedAt: new Date() });
  }

  getDealsCountByStage(workspaceId: string, pipelineId: string): Array<{ stageId: string; deals: number }> {
    const stages = Array.from(kanbanStore.stages.values()).filter((stage) => stage.workspaceId === workspaceId && stage.pipelineId === pipelineId);
    return stages.map((stage) => ({
      stageId: stage.id,
      deals: Array.from(kanbanStore.deals.values()).filter((deal) => deal.workspaceId === workspaceId && !deal.deletedAt && deal.stageId === stage.id).length
    }));
  }
}
