import { create } from 'zustand';
import { dealsApi } from '../api/deals.api';
import { toast } from '../lib/toast';
import { Deal, DealFilters } from '../types/kanban';

interface DealsStore {
  columns: Record<string, Deal[]>;
  loading: boolean;
  filters: DealFilters;
  draggingDealId: string | null;
  fetchDeals(pipelineId: string, filters?: DealFilters): Promise<void>;
  setFilters(filters: Partial<DealFilters>): void;
  setDragging(id: string | null): void;
  moveDeal(dealId: string, fromStageId: string, toStageId: string, reason?: string): Promise<void>;
  addDeal(deal: Deal): void;
  updateDeal(id: string, patch: Partial<Deal>): void;
  removeDeal(id: string): void;
  reorderInColumn(stageId: string, orderedIds: string[]): void;
}

const cloneColumns = (columns: Record<string, Deal[]>): Record<string, Deal[]> => {
  return JSON.parse(JSON.stringify(columns)) as Record<string, Deal[]>;
};

export const useDealsStore = create<DealsStore>((set, get) => ({
  columns: {},
  loading: false,
  filters: { page: 1, limit: 200 },
  draggingDealId: null,

  async fetchDeals(pipelineId: string, filters?: DealFilters) {
    const merged = { ...get().filters, ...(filters ?? {}), pipelineId };
    set({ loading: true, filters: merged });
    const response = await dealsApi.getDeals(merged);

    const columns = response.items.reduce<Record<string, Deal[]>>((acc, deal) => {
      const list = acc[deal.stageId] ?? [];
      acc[deal.stageId] = [...list, deal];
      return acc;
    }, {});

    set({ columns, loading: false });
  },

  setFilters(filters: Partial<DealFilters>) {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  setDragging(id: string | null) {
    set({ draggingDealId: id });
  },

  async moveDeal(dealId: string, fromStageId: string, toStageId: string, reason?: string) {
    const snapshot = cloneColumns(get().columns);

    set((state) => {
      const from = [...(state.columns[fromStageId] ?? [])];
      const to = [...(state.columns[toStageId] ?? [])];
      const deal = from.find((item) => item.id === dealId);
      if (!deal) return { columns: state.columns };
      const nextFrom = from.filter((item) => item.id !== dealId);
      const nextTo = [{ ...deal, stageId: toStageId }, ...to];
      return { columns: { ...state.columns, [fromStageId]: nextFrom, [toStageId]: nextTo } };
    });

    try {
      await dealsApi.moveDeal(dealId, toStageId, reason);
      toast.success('Deal movido com sucesso');
    } catch (_error) {
      set({ columns: snapshot });
      toast.error('Erro ao mover deal');
    }
  },

  addDeal(deal: Deal) {
    set((state) => ({
      columns: {
        ...state.columns,
        [deal.stageId]: [deal, ...(state.columns[deal.stageId] ?? [])]
      }
    }));
  },

  updateDeal(id: string, patch: Partial<Deal>) {
    set((state) => {
      const columns = Object.fromEntries(
        Object.entries(state.columns).map(([stageId, deals]) => [
          stageId,
          deals.map((deal) => (deal.id === id ? { ...deal, ...patch } : deal))
        ])
      );

      if (patch.stageId) {
        const found = Object.values(columns).flat().find((deal) => deal.id === id);
        if (found) {
          const previousStage = Object.keys(columns).find((stageId) => columns[stageId].some((deal) => deal.id === id));
          if (previousStage && previousStage !== patch.stageId) {
            columns[previousStage] = columns[previousStage].filter((deal) => deal.id !== id);
            columns[patch.stageId] = [{ ...found, stageId: patch.stageId }, ...(columns[patch.stageId] ?? [])];
          }
        }
      }

      return { columns };
    });
  },

  removeDeal(id: string) {
    set((state) => ({
      columns: Object.fromEntries(Object.entries(state.columns).map(([stageId, deals]) => [stageId, deals.filter((deal) => deal.id !== id)]))
    }));
  },

  reorderInColumn(stageId: string, orderedIds: string[]) {
    set((state) => {
      const current = state.columns[stageId] ?? [];
      const map = new Map(current.map((deal) => [deal.id, deal]));
      const next = orderedIds.map((id) => map.get(id)).filter((deal): deal is Deal => Boolean(deal));
      return { columns: { ...state.columns, [stageId]: next } };
    });
  }
}));
