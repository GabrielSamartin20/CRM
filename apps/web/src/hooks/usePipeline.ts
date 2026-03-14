import { useEffect } from 'react';
import { usePipelineStore } from '../store/pipeline.store';

export function usePipeline() {
  const pipelines = usePipelineStore((state) => state.pipelines);
  const activePipelineId = usePipelineStore((state) => state.activePipelineId);
  const loading = usePipelineStore((state) => state.loading);
  const fetchPipelines = usePipelineStore((state) => state.fetchPipelines);
  const setActivePipeline = usePipelineStore((state) => state.setActivePipeline);
  const getActivePipeline = usePipelineStore((state) => state.getActivePipeline);

  useEffect(() => {
    if (pipelines.length === 0) {
      void fetchPipelines();
    }
  }, [fetchPipelines, pipelines.length]);

  return {
    pipelines,
    activePipelineId,
    activePipeline: getActivePipeline(),
    loading,
    setActive: setActivePipeline
  };
}
