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
    const values = Object.values(columns)
      .flat()
      .map((deal) => deal.assignee)
      .filter((value): value is UserSummary => Boolean(value));
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

  const totals = Object.values(columns).flat();
  const totalValue = totals.reduce((sum, deal) => sum + (deal.value ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] via-[#102B52] to-[#12386C] px-7 py-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-semibold">Pipeline Comercial</h3>
            <p className="mt-1 text-sm text-blue-100">Acompanhe negociação por etapa com controle formal de valor, SLA e execução.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-right">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-200">Deals</p>
              <p className="text-lg font-semibold">{totals.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-200">Valor do Funil</p>
              <p className="text-lg font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-200">Etapas</p>
              <p className="text-lg font-semibold">{resolvedPipeline.stages.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <KanbanFilters
          pipelines={pipelines}
          activePipelineId={resolvedPipeline.id}
          assignees={assignees}
          filters={filters}
          onSetPipeline={onSetPipeline}
          onChange={setFilters}
          onClear={() => setFilters({ assigneeId: undefined, channel: undefined, search: undefined, expectedCloseDate: undefined })}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {dealsLoading ? <KanbanSkeleton /> : <KanbanBoard pipeline={resolvedPipeline} onAddDeal={(stageId) => setCreateStageId(stageId)} />}
      </div>

      {dealId && <DealDrawer open dealId={dealId} pipelineId={resolvedPipeline.id} />}

      {createStageId && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
