import { Pipeline } from '../../../types/kanban';

interface PipelineSelectorProps {
  pipelines: Pipeline[];
  activePipelineId: string | null;
  onChange(id: string): void;
}

export function PipelineSelector({ pipelines, activePipelineId, onChange }: PipelineSelectorProps) {
  return (
    <select className="rounded border px-2 py-1 text-sm" value={activePipelineId ?? ''} onChange={(event) => onChange(event.target.value)}>
      {pipelines.map((pipeline) => (
        <option key={pipeline.id} value={pipeline.id}>
          {pipeline.name}
        </option>
      ))}
    </select>
  );
}
