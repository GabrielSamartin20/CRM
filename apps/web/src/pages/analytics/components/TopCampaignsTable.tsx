import { useMemo, useState } from 'react';

interface CampaignRow {
  campaign: string;
  channel: string;
  leads: number;
  conversions: number;
  revenue: number;
}

type SortKey = keyof CampaignRow;

export function TopCampaignsTable({ data }: { data: CampaignRow[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('leads');
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const sorted = useMemo(() => {
    const cloned = [...data];
    cloned.sort((a, b) => {
      const left = a[sortBy];
      const right = b[sortBy];
      if (left === right) return 0;
      if (left > right) return asc ? 1 : -1;
      return asc ? -1 : 1;
    });
    return cloned;
  }, [asc, data, sortBy]);

  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const header = (key: SortKey, label: string) => (
    <button
      className="font-semibold"
      onClick={() => {
        if (sortBy === key) setAsc((value) => !value);
        else {
          setSortBy(key);
          setAsc(false);
        }
      }}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">Top campanhas</h3>
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th>{header('campaign', 'Campanha')}</th>
            <th>{header('channel', 'Canal')}</th>
            <th>{header('leads', 'Leads')}</th>
            <th>{header('conversions', 'Conversões')}</th>
            <th>{header('revenue', 'Receita')}</th>
            <th>CPA</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((row) => {
            const cpa = row.conversions > 0 ? row.revenue / row.conversions : 0;
            return (
              <tr key={`${row.campaign}:${row.channel}`}>
                <td>{row.campaign}</td>
                <td>{row.channel}</td>
                <td>{row.leads}</td>
                <td>{row.conversions}</td>
                <td>{row.revenue.toFixed(2)}</td>
                <td>{cpa.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}>
          Anterior
        </button>
        <span>Página {page}</span>
        <button type="button" onClick={() => setPage((value) => value + 1)}>
          Próxima
        </button>
      </div>
    </div>
  );
}
