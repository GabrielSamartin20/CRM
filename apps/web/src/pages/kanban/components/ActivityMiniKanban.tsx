import { DndContext, DragEndEvent, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { activitiesApi } from '../../../api/activities.api';
import { Activity } from '../../../types/kanban';

interface ActivityMiniKanbanProps {
  dealId: string;
  activities: Activity[];
  onChanged(next: Activity[]): void;
}

type ActivityStatus = Activity['status'];

export function ActivityMiniKanban({ dealId, activities, onChanged }: ActivityMiniKanbanProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Activity['type']>('task');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => ({
    TODO: activities.filter((item) => item.status === 'TODO'),
    IN_PROGRESS: activities.filter((item) => item.status === 'IN_PROGRESS'),
    DONE: activities.filter((item) => item.status === 'DONE')
  }), [activities]);

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    const activityId = String(event.active.id);
    const nextStatus = event.over?.id as ActivityStatus | undefined;
    if (!nextStatus) return;
    const current = activities.find((item) => item.id === activityId);
    if (!current || current.status === nextStatus) return;

    const optimistic = activities.map((item) => (item.id === activityId ? { ...item, status: nextStatus } : item));
    onChanged(optimistic);
    await activitiesApi.updateActivity(dealId, activityId, { status: nextStatus });
  };

  const createInline = async (): Promise<void> => {
    if (!title.trim()) return;
    const created = await activitiesApi.createActivity(dealId, { title, type, status: 'TODO' });
    onChanged([...activities, created]);
    setTitle('');
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(event) => void onDragEnd(event)}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {(['TODO', 'IN_PROGRESS', 'DONE'] as ActivityStatus[]).map((status) => (
            <div key={status} id={status} className="rounded border p-2">
              <h4 className="mb-2 text-xs font-semibold">{status === 'TODO' ? 'A Fazer' : status === 'IN_PROGRESS' ? 'Em Andamento' : 'Concluído'}</h4>
              <div className="space-y-1">
                {grouped[status].map((activity) => (
                  <div key={activity.id} className="rounded bg-slate-100 p-2 text-xs">
                    <strong>{activity.type}</strong> · {activity.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded border p-1 text-xs" value={type} onChange={(event) => setType(event.target.value as Activity['type'])}>
            <option value="call">Call</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="meeting">Meeting</option><option value="task">Task</option><option value="note">Note</option>
          </select>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="flex-1 rounded border p-1 text-xs" placeholder="+ Atividade" />
          <button type="button" onClick={() => void createInline()} className="rounded bg-slate-900 px-2 py-1 text-xs text-white">Adicionar</button>
        </div>
      </div>
    </DndContext>
  );
}
