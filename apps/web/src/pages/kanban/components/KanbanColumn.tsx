import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Deal, Stage } from '../../../types/kanban';
import { DealCard } from './DealCard';
import { Skeleton } from '../../../components/ui/Skeleton';

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  loading?: boolean;
  onAddDeal(stageId: string): void;
  workspaceCurrency?: string;
}

const formatCurrency = (value: number, currency: string): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);

export function KanbanColumn({ stage, deals, loading = false, onAddDeal, workspaceCurrency = 'BRL' }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: 'stage', stageId: stage.id }
  });

  const totalValue = deals.reduce((sum, deal) => sum + (deal.value ?? 0), 0);

  return (
    <section className="flex h-full w-[280px] flex-col rounded-lg border bg-slate-50" style={{ borderTop: `3px solid ${stage.color}` }}>
      <header className="sticky top-0 z-10 rounded-t-lg bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{stage.name}</h3>
          <button type="button" className="rounded bg-slate-200 px-2 py-1 text-xs" onClick={() => onAddDeal(stage.id)}>
            +
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{deals.length} deals</span>
          <span>{formatCurrency(totalValue, workspaceCurrency)}</span>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto p-2 transition-colors ${isOver ? 'bg-blue-50' : ''}`}
        style={{ maxHeight: 'calc(100vh - 220px)' }}
      >
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : deals.length === 0 ? (
          <div className="rounded border border-dashed p-6 text-center text-xs text-slate-400">Sem deals nesta etapa</div>
        ) : (
          <SortableContext items={deals.map((deal) => deal.id)} strategy={verticalListSortingStrategy}>
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} workspaceCurrency={workspaceCurrency} />
            ))}
          </SortableContext>
        )}
      </div>
    </section>
  );
}
