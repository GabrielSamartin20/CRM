import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Channel, DealFilters, Pipeline, UserSummary } from '../../../types/kanban';
import { ChannelBadge } from './ChannelBadge';
import { PipelineSelector } from './PipelineSelector';

interface KanbanFiltersProps {
  pipelines: Pipeline[];
  activePipelineId: string | null;
  assignees: UserSummary[];
  filters: DealFilters;
  onSetPipeline(id: string): void;
  onChange(filters: Partial<DealFilters>): void;
  onClear(): void;
}

const channels: Channel[] = ['GOOGLE_ADS', 'META_ADS', 'GOOGLE_ORGANIC', 'META_ORGANIC', 'DIRECT', 'REFERRAL'];

export function KanbanFilters({ pipelines, activePipelineId, assignees, filters, onSetPipeline, onChange, onClear }: KanbanFiltersProps) {
  const [, setSearchParams] = useSearchParams();
  const activeCount = useMemo(
    () => Object.values(filters).filter((value) => value !== undefined && value !== '' && value !== null).length,
    [filters]
  );

  const syncUrl = (patch: Partial<DealFilters>): void => {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    });
    setSearchParams(params);
    onChange(patch);
  };

  return (
    <div className="space-y-2 rounded border bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <PipelineSelector pipelines={pipelines} activePipelineId={activePipelineId} onChange={onSetPipeline} />
        <input
          className="rounded border px-2 py-1 text-sm"
          placeholder="Buscar"
          value={filters.search ?? ''}
          onChange={(event) => syncUrl({ search: event.target.value })}
        />
        <input type="date" className="rounded border px-2 py-1 text-sm" value={filters.expectedCloseDate ?? ''} onChange={(event) => syncUrl({ expectedCloseDate: event.target.value })} />
        {activeCount > 0 && (
          <button type="button" className="rounded bg-slate-100 px-2 py-1 text-xs" onClick={onClear}>
            {activeCount} filtros ativos · Limpar
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {channels.map((channel) => (
          <button key={channel} type="button" onClick={() => syncUrl({ channel })}>
            <ChannelBadge channel={channel} />
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {assignees.map((assignee) => (
          <button key={assignee.id} type="button" onClick={() => syncUrl({ assigneeId: assignee.id })} className="rounded border px-2 py-1 text-xs">
            {assignee.name}
          </button>
        ))}
      </div>
    </div>
  );
}
