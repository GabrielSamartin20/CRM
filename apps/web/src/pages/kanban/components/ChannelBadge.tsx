import { Channel } from '../../../types/kanban';

const svg = {
  google: <span className="font-bold text-blue-600">G</span>,
  googleOrg: <span className="font-bold text-green-600">G</span>,
  metaAds: <span className="font-bold text-blue-900">f</span>,
  metaOrg: <span className="font-bold text-blue-600">f</span>,
  direct: <span>🔗</span>,
  referral: <span>↗</span>,
  other: <span>•</span>
};

export function ChannelBadge({ channel, source }: { channel: Channel | null; source?: string }) {
  if (!channel) return null;

  const map: Record<Channel, { icon: JSX.Element; label: string; cls: string }> = {
    GOOGLE_ADS: { icon: svg.google, label: 'Google Ads', cls: 'bg-blue-50 text-blue-700' },
    GOOGLE_ORGANIC: { icon: svg.googleOrg, label: 'Orgânico', cls: 'bg-green-50 text-green-700' },
    META_ADS: { icon: svg.metaAds, label: 'Meta Ads', cls: 'bg-indigo-50 text-indigo-700' },
    META_ORGANIC: { icon: svg.metaOrg, label: 'Meta', cls: 'bg-blue-50 text-blue-700' },
    DIRECT: { icon: svg.direct, label: 'Direto', cls: 'bg-slate-50 text-slate-700' },
    REFERRAL: { icon: svg.referral, label: source ?? 'Referral', cls: 'bg-amber-50 text-amber-700' },
    EMAIL: { icon: svg.other, label: 'Email', cls: 'bg-slate-50 text-slate-700' },
    SMS: { icon: svg.other, label: 'SMS', cls: 'bg-slate-50 text-slate-700' },
    OTHER: { icon: svg.other, label: 'Outro', cls: 'bg-slate-50 text-slate-700' }
  };

  const item = map[channel];
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${item.cls}`}>
      {item.icon}
      {item.label}
    </span>
  );
}
