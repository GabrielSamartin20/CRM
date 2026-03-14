import { useEffect } from 'react';
import { useDealsStore } from '../store/deals.store';
import { usePipelineStore } from '../store/pipeline.store';

export function useDeals() {
  const columns = useDealsStore((state) => state.columns);
  const loading = useDealsStore((state) => state.loading);
  const filters = useDealsStore((state) => state.filters);
  const setFilters = useDealsStore((state) => state.setFilters);
  const fetchDeals = useDealsStore((state) => state.fetchDeals);
  const moveDeal = useDealsStore((state) => state.moveDeal);
  const activePipelineId = usePipelineStore((state) => state.activePipelineId);

  useEffect(() => {
    if (activePipelineId) {
      void fetchDeals(activePipelineId, filters);
    }
  }, [activePipelineId, fetchDeals, filters]);

  return { columns, loading, moveDeal, filters, setFilters };
}
