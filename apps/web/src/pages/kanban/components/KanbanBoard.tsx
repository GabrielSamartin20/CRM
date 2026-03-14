import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import { Deal, Pipeline } from '../../../types/kanban';
import { useDealsStore } from '../../../store/deals.store';
import { DealCard } from './DealCard';
import { KanbanColumn } from './KanbanColumn';
import { LostReasonModal, LostReasonValue } from './LostReasonModal';

interface KanbanBoardProps {
  pipeline: Pipeline;
  workspaceCurrency?: string;
  onAddDeal(stageId: string): void;
}

interface PendingLost {
  dealId: string;
  fromStageId: string;
  toStageId: string;
}

export function KanbanBoard({ pipeline, workspaceCurrency = 'BRL', onAddDeal }: KanbanBoardProps) {
  const { columns, setDragging, moveDeal, reorderInColumn } = useDealsStore();
  const [activeCard, setActiveCard] = useState<Deal | null>(null);
  const [pendingLost, setPendingLost] = useState<PendingLost | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const stageMap = useMemo(() => new Map(pipeline.stages.map((stage) => [stage.id, stage])), [pipeline.stages]);

  const handleDragStart = (event: DragStartEvent): void => {
    setDragging(String(event.active.id));
    const deal = event.active.data.current?.deal as Deal | undefined;
    setActiveCard(deal ?? null);
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    setDragging(null);
    setActiveCard(null);
    const activeId = String(event.active.id);
    const fromStageId = String(event.active.data.current?.stageId ?? '');
    const over = event.over;
    if (!over) return;
    const overId = String(over.id);
    const overStageId = String(over.data.current?.stageId ?? overId);

    if (fromStageId === overStageId) {
      const ids = (columns[fromStageId] ?? []).map((deal) => deal.id);
      if (ids.includes(overId)) {
        const filtered = ids.filter((id) => id !== activeId);
        const index = filtered.indexOf(overId);
        const reordered = [...filtered.slice(0, index), activeId, ...filtered.slice(index)];
        reorderInColumn(fromStageId, reordered);
      }
      return;
    }

    const target = stageMap.get(overStageId);
    if (target?.type === 'CLOSED_LOST') {
      setPendingLost({ dealId: activeId, fromStageId, toStageId: overStageId });
      return;
    }

    void moveDeal(activeId, fromStageId, overStageId);
  };

  const confirmLost = (value: LostReasonValue): void => {
    if (!pendingLost) return;
    void moveDeal(pendingLost.dealId, pendingLost.fromStageId, pendingLost.toStageId, `${value.reason}${value.details ? `: ${value.details}` : ''}`);
    setPendingLost(null);
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveCard(null)}>
        <SortableContext items={pipeline.stages.map((stage) => stage.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {pipeline.stages.map((stage) => (
              <KanbanColumn key={stage.id} stage={stage} deals={columns[stage.id] ?? []} workspaceCurrency={workspaceCurrency} onAddDeal={onAddDeal} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>{activeCard ? <DealCard deal={activeCard} isOverlay workspaceCurrency={workspaceCurrency} /> : null}</DragOverlay>
      </DndContext>

      <LostReasonModal open={Boolean(pendingLost)} onClose={() => setPendingLost(null)} onConfirm={confirmLost} />
    </>
  );
}
