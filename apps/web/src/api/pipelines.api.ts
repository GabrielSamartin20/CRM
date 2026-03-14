import { http } from './http';
import { Pipeline, Stage } from '../types/kanban';

export const pipelinesApi = {
  getPipelines(): Promise<Pipeline[]> {
    return http<Pipeline[]>('/api/v1/pipelines');
  },
  createPipeline(data: { name: string; description?: string }): Promise<Pipeline> {
    return http<Pipeline>('/api/v1/pipelines', { method: 'POST', body: JSON.stringify(data) });
  },
  updatePipeline(id: string, data: { name?: string; description?: string }): Promise<Pipeline> {
    return http<Pipeline>(`/api/v1/pipelines/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deletePipeline(id: string): Promise<{ ok: boolean }> {
    return http<{ ok: boolean }>(`/api/v1/pipelines/${id}`, { method: 'DELETE' });
  },
  reorderPipelines(items: Array<{ id: string; order: number }>): Promise<Pipeline[]> {
    return http<Pipeline[]>('/api/v1/pipelines/reorder', { method: 'PATCH', body: JSON.stringify({ pipelines: items }) });
  },
  createStage(pipelineId: string, data: { name: string; color: string; probability: number; order: number; slaHours?: number; type?: 'OPEN' | 'CLOSED_WON' | 'CLOSED_LOST' }): Promise<Stage> {
    return http<Stage>(`/api/v1/pipelines/${pipelineId}/stages`, { method: 'POST', body: JSON.stringify(data) });
  },
  updateStage(pipelineId: string, stageId: string, data: { name?: string; color?: string; probability?: number; order?: number; slaHours?: number; type?: 'OPEN' | 'CLOSED_WON' | 'CLOSED_LOST' }): Promise<Stage> {
    return http<Stage>(`/api/v1/pipelines/${pipelineId}/stages/${stageId}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteStage(pipelineId: string, stageId: string): Promise<{ ok: boolean }> {
    return http<{ ok: boolean }>(`/api/v1/pipelines/${pipelineId}/stages/${stageId}`, { method: 'DELETE' });
  },
  reorderStages(pipelineId: string, items: Array<{ id: string; order: number }>): Promise<Stage[]> {
    return http<Stage[]>(`/api/v1/pipelines/${pipelineId}/stages/reorder`, { method: 'PATCH', body: JSON.stringify({ stages: items }) });
  }
};
