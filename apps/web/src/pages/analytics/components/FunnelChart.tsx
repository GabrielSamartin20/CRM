import { Funnel, FunnelChart as RechartsFunnelChart, LabelList, ResponsiveContainer, Tooltip } from 'recharts';

interface FunnelRow {
  stage: string;
  channel: string;
  count: number;
}

export function FunnelChart({ data }: { data: FunnelRow[] }) {
  const grouped = ['Lead', 'Qualificado', 'Proposta', 'Ganho'].map((stage) => ({
    stage,
    count: data.filter((row) => row.stage === stage).reduce((sum, row) => sum + row.count, 0)
  }));

  return (
    <div className="h-80 w-full rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">Funil de conversão</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsFunnelChart>
          <Tooltip />
          <Funnel dataKey="count" data={grouped} isAnimationActive>
            <LabelList position="right" fill="#111827" stroke="none" dataKey="stage" />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
}
