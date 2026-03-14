import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dealsApi } from '../../../api/deals.api';
import { Sheet, SheetContent } from '../../../components/ui/Sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { DealDetail } from '../../../types/kanban';
import { ActivityMiniKanban } from './ActivityMiniKanban';

interface DealDrawerProps {
  open: boolean;
  dealId: string;
  pipelineId: string;
}

const currency = (value?: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

export function DealDrawer({ open, dealId, pipelineId }: DealDrawerProps) {
  const navigate = useNavigate();
  const params = useParams();
  const [detail, setDetail] = useState<DealDetail | null>(null);

  useEffect(() => {
    if (!open) return;
    void dealsApi.getDeal(dealId).then((value) => setDetail(value));
  }, [open, dealId]);

  const close = (): void => {
    navigate(`/kanban/${pipelineId}`, { replace: true });
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && close()}>
      <SheetContent className="w-[560px] max-w-[560px] overflow-y-auto p-4">
        {detail ? (
          <Tabs defaultValue="summary">
            <TabsList>
              <TabsTrigger value="summary">Resumo</TabsTrigger>
              <TabsTrigger value="activities">Atividades</TabsTrigger>
              <TabsTrigger value="conversations">Conversas</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <h2 className="text-lg font-semibold">{detail.deal.title}</h2>
              <p className="text-sm text-slate-600">{currency(detail.deal.value)}</p>
              <p className="text-xs text-slate-500">Stage atual: {detail.deal.stageId}</p>
              <p className="text-xs text-slate-500">URL: /kanban/{params.pipelineId ?? detail.deal.pipelineId}/deals/{detail.deal.id}</p>
            </TabsContent>
            <TabsContent value="activities">
              <ActivityMiniKanban dealId={detail.deal.id} activities={detail.activities} onChanged={(activities) => setDetail({ ...detail, activities })} />
            </TabsContent>
            <TabsContent value="conversations">
              <button type="button" className="rounded bg-slate-900 px-2 py-1 text-xs text-white" onClick={() => navigate(`/conversations/${detail.contact?.id ?? ''}`)}>
                Abrir conversa
              </button>
            </TabsContent>
            <TabsContent value="timeline">
              <ul className="space-y-2">
                {detail.timeline.map((event) => (
                  <li key={event.id} className="rounded border p-2 text-xs">{event.event}</li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="history">
              <table className="w-full text-left text-xs">
                <thead><tr><th>Stage</th><th>Entrou</th><th>Saiu</th><th>Tempo</th></tr></thead>
                <tbody>
                  {detail.stageHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.toStageId}</td>
                      <td>{new Date(item.movedAt).toLocaleString('pt-BR')}</td>
                      <td>-</td>
                      <td>{item.timeInPreviousStageSeconds ?? 0}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-sm text-slate-500">Carregando deal...</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
