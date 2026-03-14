import { SlaStatus } from '../../../types/kanban';

export function SlaIndicator({ slaStatus, hoursInStage }: { slaStatus: SlaStatus; hoursInStage: number }) {
  if (slaStatus === 'ok') return null;

  const days = Math.floor(hoursInStage / 24);
  const hours = Math.floor(hoursInStage % 24);

  if (slaStatus === 'overdue') {
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700">Atrasado</span>;
  }

  if (slaStatus === 'critical') {
    return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] text-orange-700">{days}d</span>;
  }

  return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] text-yellow-700">{days}d {hours}h</span>;
}
