import { useEffect } from 'react';
import { toast } from '../lib/toast';
import { useDealsStore } from '../store/deals.store';
import { useSocket } from './useSocket';
import { Deal } from '../types/kanban';

export function useDealSocket() {
  const { socket } = useSocket();
  const addDeal = useDealsStore((state) => state.addDeal);
  const updateDeal = useDealsStore((state) => state.updateDeal);

  useEffect(() => {
    if (!socket) return;

    const onCreated = (payload: { deal: Deal }) => addDeal(payload.deal);
    const onUpdated = (payload: { deal: Deal }) => updateDeal(payload.deal.id, payload.deal);
    const onMoved = (payload: { dealId: string; toStageId: string }) => updateDeal(payload.dealId, { stageId: payload.toStageId });
    const onSlaAlert = (payload: { dealId: string; dealName?: string }) => {
      toast.warning(`Deal sem movimentação há mais de 72h (${payload.dealName ?? payload.dealId})`);
    };

    socket.on('deal:created', onCreated);
    socket.on('deal:updated', onUpdated);
    socket.on('deal:moved', onMoved);
    socket.on('deal:sla_alert', onSlaAlert);

    return () => {
      socket.off('deal:created', onCreated);
      socket.off('deal:updated', onUpdated);
      socket.off('deal:moved', onMoved);
      socket.off('deal:sla_alert', onSlaAlert);
    };
  }, [addDeal, socket, updateDeal]);
}
