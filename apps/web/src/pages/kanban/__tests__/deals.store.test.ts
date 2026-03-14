import { describe, expect, it, vi } from 'vitest';
import { useDealsStore } from '../../../store/deals.store';
import { dealsApi } from '../../../api/deals.api';
import { Deal } from '../../../types/kanban';

vi.mock('../../../api/deals.api', () => ({
  dealsApi: {
    moveDeal: vi.fn(),
    getDeals: vi.fn(async () => ({ items: [], total: 0 }))
  }
}));

const sampleDeal: Deal = {
  id: 'deal-1',
  title: 'Sample',
  contactId: 'c1',
  pipelineId: 'p1',
  stageId: 's1',
  currency: 'BRL',
  tags: [],
  channel: 'DIRECT',
  daysInStage: 0,
  slaStatus: 'ok'
};

describe('deals store optimistic move', () => {
  it('updates columns optimistically before API resolves', async () => {
    const deferred = new Promise<void>((resolve) => setTimeout(resolve, 20));
    vi.mocked(dealsApi.moveDeal).mockReturnValueOnce(deferred);

    useDealsStore.setState({ columns: { s1: [sampleDeal], s2: [] } });
    const action = useDealsStore.getState().moveDeal('deal-1', 's1', 's2');

    expect(useDealsStore.getState().columns.s2[0]?.id).toBe('deal-1');
    await action;
  });

  it('rolls back when API fails', async () => {
    vi.mocked(dealsApi.moveDeal).mockRejectedValueOnce(new Error('boom'));
    useDealsStore.setState({ columns: { s1: [sampleDeal], s2: [] } });

    await useDealsStore.getState().moveDeal('deal-1', 's1', 's2');

    expect(useDealsStore.getState().columns.s1[0]?.id).toBe('deal-1');
  });

  it('adds deal at column start', () => {
    useDealsStore.setState({ columns: { s1: [] } });
    useDealsStore.getState().addDeal(sampleDeal);
    expect(useDealsStore.getState().columns.s1[0]?.id).toBe('deal-1');
  });
});
