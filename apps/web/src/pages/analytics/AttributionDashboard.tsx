import { useEffect, useState } from 'react';
import { ChannelChart } from './components/ChannelChart';
import { FunnelChart } from './components/FunnelChart';
import { TopCampaignsTable } from './components/TopCampaignsTable';

interface AttributionAnalyticsResponse {
  byChannel: Array<{ channel: string; leads: number; conversions: number; revenue: number }>;
  byDay: Array<{ date: string; channel: string; leads: number }>;
  topCampaigns: Array<{ campaign: string; channel: string; leads: number; conversions: number; revenue: number }>;
  funnel: Array<{ stage: string; channel: string; count: number }>;
}

export default function AttributionDashboard() {
  const [data, setData] = useState<AttributionAnalyticsResponse | null>(null);

  useEffect(() => {
    void fetch('/api/v1/analytics/attribution')
      .then(async (response) => response.json() as Promise<AttributionAnalyticsResponse>)
      .then((payload) => setData(payload))
      .catch(() => setData({ byChannel: [], byDay: [], topCampaigns: [], funnel: [] }));
  }, []);

  if (!data) {
    return <div className="p-4">Carregando analytics...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Attribution Dashboard</h1>
      <ChannelChart data={data.byChannel} />
      <FunnelChart data={data.funnel} />
      <TopCampaignsTable data={data.topCampaigns} />
    </div>
  );
}
