import { randomUUID } from 'node:crypto';
import { AppError } from '../../lib/errors';
import { DealsService, kanbanStore } from '../deals/deals.service';
import { PipelineRecord, StageRecord } from '../deals/deals.types';

const defaultStages = [
  { name: 'Novo Lead', probability: 10, type: 'OPEN' as const, color: '#3B82F6' },
  { name: 'Qualificado', probability: 30, type: 'OPEN' as const, color: '#6366F1' },
  { name: 'Proposta Enviada', probability: 60, type: 'OPEN' as const, color: '#8B5CF6' },
  { name: 'Negociação', probability: 80, type: 'OPEN' as const, color: '#A855F7' },
  { name: 'Ganho', probability: 100, type: 'CLOSED_WON' as const, color: '#22C55E' },
  { name: 'Perdido', probability: 0, type: 'CLOSED_LOST' as const, color: '#EF4444' }
];

export class PipelinesService {
  constructor(private readonly dealsService: DealsService = new DealsService()) {}

  list(workspaceId: string): Array<Record<string, unknown>> {
    const pipelines = Array.from(kanbanStore.pipelines.values())
      .filter((pipeline) => pipeline.workspaceId === workspaceId && pipeline.deletedAt === null)
      .sort((a, b) => a.order - b.order);

    return pipelines.map((pipeline) => {
      const stages = Array.from(kanbanStore.stages.values())
        .filter((stage) => stage.workspaceId === workspaceId && stage.pipelineId === pipeline.id)
        .sort((a, b) => a.order - b.order);
      const counts = this.dealsService.getDealsCountByStage(workspaceId, pipeline.id);
      return {
        ...pipeline,
        stages: stages.map((stage) => ({ ...stage, dealsCount: counts.find((item) => item.stageId === stage.id)?.deals ?? 0 }))
      };
    });
  }

  create(workspaceId: string, body: { name: string; description?: string }): PipelineRecord {
    const order = Array.from(kanbanStore.pipelines.values()).filter((pipeline) => pipeline.workspaceId === workspaceId && pipeline.deletedAt === null).length;
    const pipeline: PipelineRecord = {
      id: randomUUID(),
      workspaceId,
      name: body.name,
      description: body.description,
      order,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    kanbanStore.pipelines.set(pipeline.id, pipeline);

    const activeCount = Array.from(kanbanStore.pipelines.values()).filter((row) => row.workspaceId === workspaceId && row.deletedAt === null).length;
    if (activeCount === 1) {
      defaultStages.forEach((stage, index) => {
        const created: StageRecord = {
          id: randomUUID(),
          workspaceId,
          pipelineId: pipeline.id,
          name: stage.name,
          color: stage.color,
          probability: stage.probability,
          order: index,
          type: stage.type,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        kanbanStore.stages.set(created.id, created);
      });
    }

    return pipeline;
  }

  update(workspaceId: string, pipelineId: string, body: { name?: string; description?: string }): PipelineRecord {
    const pipeline = kanbanStore.pipelines.get(pipelineId);
    if (!pipeline || pipeline.workspaceId !== workspaceId || pipeline.deletedAt) {
      throw new AppError({ statusCode: 404, code: 'PIPELINE_NOT_FOUND', message: 'Pipeline não encontrado' });
    }

    const updated = { ...pipeline, ...body, updatedAt: new Date() };
    kanbanStore.pipelines.set(pipelineId, updated);
    return updated;
  }

  softDelete(workspaceId: string, pipelineId: string): void {
    const pipeline = kanbanStore.pipelines.get(pipelineId);
    if (!pipeline || pipeline.workspaceId !== workspaceId || pipeline.deletedAt) {
      throw new AppError({ statusCode: 404, code: 'PIPELINE_NOT_FOUND', message: 'Pipeline não encontrado' });
    }

    const hasOpenDeals = Array.from(kanbanStore.deals.values()).some(
      (deal) => deal.workspaceId === workspaceId && !deal.deletedAt && deal.pipelineId === pipelineId && deal.status === 'OPEN'
    );
    if (hasOpenDeals) {
      throw new AppError({ statusCode: 409, code: 'PIPELINE_HAS_OPEN_DEALS', message: 'Pipeline possui deals abertos' });
    }

    kanbanStore.pipelines.set(pipelineId, { ...pipeline, deletedAt: new Date(), updatedAt: new Date() });
  }

  reorder(workspaceId: string, body: { pipelines: Array<{ id: string; order: number }> }): Array<PipelineRecord> {
    const current = new Map(kanbanStore.pipelines);

    try {
      const updated: PipelineRecord[] = [];
      for (const row of body.pipelines) {
        const pipeline = kanbanStore.pipelines.get(row.id);
        if (!pipeline || pipeline.workspaceId !== workspaceId || pipeline.deletedAt) {
          throw new AppError({ statusCode: 404, code: 'PIPELINE_NOT_FOUND', message: 'Pipeline não encontrado na transação' });
        }
        const next = { ...pipeline, order: row.order, updatedAt: new Date() };
        kanbanStore.pipelines.set(row.id, next);
        updated.push(next);
      }

      return updated.sort((a, b) => a.order - b.order);
    } catch (error) {
      kanbanStore.pipelines.clear();
      current.forEach((value, key) => kanbanStore.pipelines.set(key, value));
      throw error;
    }
  }
}
