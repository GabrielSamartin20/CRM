import { Deal, DealDetail, DealFilters, DealsResponse } from '../types/kanban';
import { http } from './http';

const toQuery = (params: DealFilters): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  return search.toString();
};

export const dealsApi = {
  getDeals(params: DealFilters): Promise<DealsResponse> {
    const query = toQuery(params);
    return http<DealsResponse>(`/api/v1/deals${query ? `?${query}` : ''}`);
  },
  getDeal(id: string): Promise<DealDetail> {
    return http<DealDetail>(`/api/v1/deals/${id}`);
  },
  createDeal(data: {
    title: string;
    contactId: string;
    pipelineId: string;
    stageId: string;
    value?: number;
    currency?: string;
    expectedCloseDate?: string;
    assigneeId?: string;
    description?: string;
    tags?: string[];
  }): Promise<Deal> {
    return http<Deal>('/api/v1/deals', { method: 'POST', body: JSON.stringify(data) });
  },
  updateDeal(id: string, data: Partial<Omit<Deal, 'id'>>): Promise<Deal> {
    return http<Deal>(`/api/v1/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  moveDeal(id: string, stageId: string, reason?: string): Promise<Deal> {
    return http<Deal>(`/api/v1/deals/${id}/move`, { method: 'PATCH', body: JSON.stringify({ stageId, reason }) });
  },
  deleteDeal(id: string): Promise<{ ok: boolean }> {
    return http<{ ok: boolean }>(`/api/v1/deals/${id}`, { method: 'DELETE' });
  }
};
