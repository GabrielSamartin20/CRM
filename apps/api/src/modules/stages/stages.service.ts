import { randomUUID } from 'node:crypto';
import { AppError } from '../../lib/errors';
import { kanbanStore } from '../deals/deals.service';
import { StageRecord } from '../deals/deals.types';

export class StagesService {
  create(workspaceId: string, pipelineId: string, body: { name: string; color: string; probability: number; order: number; slaHours?: number; type?: 'OPEN' | 'CLOSED_WON' | 'CLOSED_LOST' }): StageRecord {
    const stage: StageRecord = {
      id: randomUUID(),
      workspaceId,
      pipelineId,
      name: body.name,
      color: body.color,
      probability: body.probability,
      order: body.order,
      type: body.type ?? 'OPEN',
      slaHours: body.slaHours,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    kanbanStore.stages.set(stage.id, stage);
    return stage;
  }

  update(workspaceId: string, pipelineId: string, stageId: string, body: { name?: string; color?: string; probability?: number; order?: number; slaHours?: number; type?: 'OPEN' | 'CLOSED_WON' | 'CLOSED_LOST' }): StageRecord {
    const stage = kanbanStore.stages.get(stageId);
    if (!stage || stage.workspaceId !== workspaceId || stage.pipelineId !== pipelineId) {
      throw new AppError({ statusCode: 404, code: 'STAGE_NOT_FOUND', message: 'Stage não encontrado' });
    }

    const updated = { ...stage, ...body, updatedAt: new Date() };
    kanbanStore.stages.set(stageId, updated);
    return updated;
  }

  remove(workspaceId: string, pipelineId: string, stageId: string): void {
    const stage = kanbanStore.stages.get(stageId);
    if (!stage || stage.workspaceId !== workspaceId || stage.pipelineId !== pipelineId) {
      throw new AppError({ statusCode: 404, code: 'STAGE_NOT_FOUND', message: 'Stage não encontrado' });
    }

    const count = Array.from(kanbanStore.deals.values()).filter((deal) => deal.workspaceId === workspaceId && !deal.deletedAt && deal.stageId === stageId).length;
    if (count > 0) {
      throw new AppError({ statusCode: 409, code: 'STAGE_HAS_DEALS', message: 'Stage possui deals vinculados', details: { dealsCount: count } });
    }

    kanbanStore.stages.delete(stageId);
  }

  reorder(workspaceId: string, pipelineId: string, body: { stages: Array<{ id: string; order: number }> }): Array<StageRecord> {
    const snapshot = new Map(kanbanStore.stages);
    try {
      const updated: StageRecord[] = [];
      for (const row of body.stages) {
        const stage = kanbanStore.stages.get(row.id);
        if (!stage || stage.workspaceId !== workspaceId || stage.pipelineId !== pipelineId) {
          throw new AppError({ statusCode: 404, code: 'STAGE_NOT_FOUND', message: 'Stage não encontrado na transação' });
        }
        const next = { ...stage, order: row.order, updatedAt: new Date() };
        kanbanStore.stages.set(stage.id, next);
        updated.push(next);
      }
      return updated.sort((a, b) => a.order - b.order);
    } catch (error) {
      kanbanStore.stages.clear();
      snapshot.forEach((value, key) => kanbanStore.stages.set(key, value));
      throw error;
    }
  }
}
