import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { useNavigate, useParams } from 'react-router-dom';
import { Deal } from '../../../types/kanban';
import { ChannelBadge } from './ChannelBadge';
import { SlaIndicator } from './SlaIndicator';

interface DealCardProps {
  deal: Deal;
  workspaceCurrency?: string;
  isOverlay?: boolean;
}

const formatMoney = (value: number | undefined, currency: string): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value ?? 0);

const initials = (name?: string): string =>
  (name ?? 'Sem Nome')
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('');

const leftBorderClass = (status: Deal['slaStatus']): string => {
  if (status === 'warning') return 'border-l-2 border-l-yellow-400';
  if (status === 'critical' || status === 'overdue') return 'border-l-2 border-l-red-500';
  return '';
};

export function DealCard({ deal, workspaceCurrency = 'BRL', isOverlay = false }: DealCardProps) {
  const navigate = useNavigate();
  const params = useParams();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: 'deal', stageId: deal.stageId, deal }
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    rotate: isOverlay ? '2deg' : undefined
  };

  return (
    <article ref={setNodeRef} style={style} className={`rounded-md border bg-white p-3 shadow-sm ${leftBorderClass(deal.slaStatus)}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
            {initials(deal.contact?.name)}
          </div>
          <span className="text-xs font-medium">{deal.contact?.name ?? 'Sem contato'}</span>
        </div>
        <ChannelBadge channel={deal.channel} source={deal.utmSource} />
      </div>

      <button
        className="mb-2 block w-full text-left text-sm font-semibold"
        onClick={() => navigate(`/kanban/${params.pipelineId ?? deal.pipelineId}/deals/${deal.id}`)}
        type="button"
      >
        {deal.title}
      </button>

      <div className="mb-2 flex items-center justify-between text-xs text-slate-700">
        <span>{formatMoney(deal.value, workspaceCurrency)}</span>
        <SlaIndicator slaStatus={deal.slaStatus} hoursInStage={deal.hoursInStage ?? deal.daysInStage * 24} />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200">
          {initials(deal.assignee?.name)}
        </div>
        <span>{deal.daysInStage}d</span>
        <span>● {deal.pendingActivities ?? 0}</span>
      </div>

      <div className="mt-2 cursor-grab text-right text-[10px] text-slate-400" {...attributes} {...listeners}>
        Arrastar
      </div>
    </article>
  );
}
