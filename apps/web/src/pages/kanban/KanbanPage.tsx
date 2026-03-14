import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeals } from '../../hooks/useDeals';
import { useDealSocket } from '../../hooks/useDealSocket';
import { usePipeline } from '../../hooks/usePipeline';
import { Deal, UserSummary } from '../../types/kanban';
import { KanbanBoard } from './components/KanbanBoard';
import { KanbanFilters } from './components/KanbanFilters';
import { KanbanSkeleton } from './components/KanbanSkeleton';
import { DealDrawer } from './components/DealDrawer';
import { DealForm } from './components/DealForm';

export function KanbanPage() {
  const navigate = useNavigate();
  const { pipelineId, dealId } = useParams();
  const { pipelines, activePipeline, loading: pipelineLoading, setActive } = usePipeline();
  const { columns, loading: dealsLoading, filters, setFilters, fetchDeals } = useDeals();
  useDealSocket();

  const [createStageId, setCreateStageId] = useState<string | null>(null);

  const assignees = useMemo<UserSummary[]>(() => {
    const values = Object.values(columns).flat().map((deal) => deal.assignee).filter((value): value is UserSummary => Boolean(value));
    const map = new Map(values.map((user) => [user.id, user]));
    return Array.from(map.values());
  }, [columns]);

  const contacts = useMemo(() => {
    const deals = Object.values(columns).flat();
    const items = deals.map((deal) => deal.contact).filter((item): item is NonNullable<Deal['contact']> => Boolean(item));
    const map = new Map(items.map((contact) => [contact.id, contact]));
    return Array.from(map.values());
  }, [columns]);

  const resolvedPipeline = useMemo(() => {
    if (pipelineId) {
      const found = pipelines.find((item) => item.id === pipelineId);
      if (found) return found;
    }
    return activePipeline;
  }, [pipelineId, pipelines, activePipeline]);

  const onSetPipeline = (id: string): void => {
    setActive(id);
    navigate(`/kanban/${id}`);
    void fetchDeals(id);
  };

  if (pipelineLoading || !resolvedPipeline) return <KanbanSkeleton />;

  return (
    <div className="space-y-4 p-4">
      <KanbanFilters
        pipelines={pipelines}
        activePipelineId={resolvedPipeline.id}
        assignees={assignees}
        filters={filters}
        onSetPipeline={onSetPipeline}
        onChange={setFilters}
        onClear={() => setFilters({ assigneeId: undefined, channel: undefined, search: undefined, expectedCloseDate: undefined })}
      />

      {dealsLoading ? <KanbanSkeleton /> : <KanbanBoard pipeline={resolvedPipeline} onAddDeal={(stageId) => setCreateStageId(stageId)} />}

      {dealId && <DealDrawer open dealId={dealId} pipelineId={resolvedPipeline.id} />}

      {createStageId && (
        <div className="rounded border bg-white p-4">
          <DealForm
            mode="create"
            contacts={contacts}
            assignees={assignees}
            pipelines={[resolvedPipeline]}
            stages={resolvedPipeline.stages}
            lockedPipelineId={resolvedPipeline.id}
            onSaved={() => {
              setCreateStageId(null);
              void fetchDeals(resolvedPipeline.id);
            }}
          />
        </div>
      )}
    </div>
  );
}
