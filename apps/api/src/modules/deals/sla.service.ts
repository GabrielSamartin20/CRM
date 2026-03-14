import { SlaStatus, DealRecord, StageRecord } from './deals.types';

export function getDealSlaStatus(deal: {
  stageEnteredAt: Date;
  stage: Pick<StageRecord, 'slaHours'>;
}): { status: SlaStatus; hoursInStage: number; hoursRemaining?: number } {
  const hoursInStage = (Date.now() - deal.stageEnteredAt.getTime()) / (1000 * 60 * 60);

  if (!deal.stage.slaHours) {
    if (hoursInStage < 24) return { status: 'ok', hoursInStage };
    if (hoursInStage <= 72) return { status: 'warning', hoursInStage };
    return { status: 'critical', hoursInStage };
  }

  const remaining = deal.stage.slaHours - hoursInStage;
  const usage = hoursInStage / deal.stage.slaHours;
  if (usage > 1) return { status: 'overdue', hoursInStage, hoursRemaining: remaining };
  if (usage > 0.8) return { status: 'warning', hoursInStage, hoursRemaining: remaining };
  return { status: 'ok', hoursInStage, hoursRemaining: remaining };
}

export const getDaysInStage = (deal: Pick<DealRecord, 'stageEnteredAt'>): number => {
  return Math.max(0, Math.floor((Date.now() - deal.stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24)));
};
