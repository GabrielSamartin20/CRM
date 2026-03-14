import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ChannelRow {
  channel: string;
  leads: number;
  conversions: number;
  revenue: number;
}

const colorByChannel: Record<string, string> = {
  GOOGLE_ADS: '#2563EB',
  META_ADS: '#7C3AED',
  GOOGLE_ORGANIC: '#16A34A',
  META_ORGANIC: '#16A34A',
  DIRECT: '#6B7280',
  REFERRAL: '#D97706'
};

export function ChannelChart({ data }: { data: ChannelRow[] }) {
  return (
    <div className="h-80 w-full rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">Leads por canal</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="channel" />
          <YAxis />
          <Tooltip
            formatter={(value: number, _name, item) => {
              const row = item?.payload as ChannelRow;
              const conversionRate = row.leads > 0 ? ((row.conversions / row.leads) * 100).toFixed(1) : '0.0';
              return [`${value}`, `Leads (conv: ${row.conversions} | taxa: ${conversionRate}%)`];
            }}
          />
          <Bar dataKey="leads" fill="#2563EB">
            {data.map((row) => (
              <Cell key={row.channel} fill={colorByChannel[row.channel] ?? '#334155'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
