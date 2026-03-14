import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pipelinesApi } from '../api/pipelines.api';
import { Pipeline } from '../types/kanban';

interface PipelineStore {
  pipelines: Pipeline[];
  activePipelineId: string | null;
  loading: boolean;
  fetchPipelines(): Promise<void>;
  setActivePipeline(id: string): void;
  getActivePipeline(): Pipeline | undefined;
}

export const usePipelineStore = create<PipelineStore>()(
  persist(
    (set, get) => ({
      pipelines: [],
      activePipelineId: null,
      loading: false,
      async fetchPipelines() {
        set({ loading: true });
        const pipelines = await pipelinesApi.getPipelines();
        const currentActive = get().activePipelineId;
        const activePipelineId = currentActive && pipelines.some((pipeline) => pipeline.id === currentActive) ? currentActive : pipelines[0]?.id ?? null;
        set({ pipelines, activePipelineId, loading: false });
      },
      setActivePipeline(id: string) {
        set({ activePipelineId: id });
      },
      getActivePipeline() {
        const state = get();
        return state.pipelines.find((pipeline) => pipeline.id === state.activePipelineId);
      }
    }),
    { name: 'crm-pipeline', partialize: (state) => ({ activePipelineId: state.activePipelineId }) }
  )
);
