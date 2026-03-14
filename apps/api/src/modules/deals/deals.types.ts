import { Channel } from '../attribution/attribution.types';

export type DealStatus = 'OPEN' | 'CLOSED_WON' | 'CLOSED_LOST';
export type SlaStatus = 'ok' | 'warning' | 'critical' | 'overdue';

export interface PipelineRecord {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  order: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StageRecord {
  id: string;
  workspaceId: string;
  pipelineId: string;
  name: string;
  color: string;
  probability: number;
  order: number;
  type: 'OPEN' | 'CLOSED_WON' | 'CLOSED_LOST';
  slaHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealRecord {
  id: string;
  workspaceId: string;
  title: string;
  contactId: string;
  pipelineId: string;
  stageId: string;
  assigneeId?: string;
  value?: number;
  currency: string;
  expectedCloseDate?: string;
  description?: string;
  tags: string[];
  status: DealStatus;
  stageEnteredAt: Date;
  wonAt?: Date;
  lostAt?: Date;
  lostReason?: string;
  actualValue?: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealStageHistoryRecord {
  id: string;
  workspaceId: string;
  dealId: string;
  fromStageId: string | null;
  toStageId: string;
  movedAt: Date;
  movedBy: string;
  timeInPreviousStageSeconds?: number;
  reason?: string;
}

export interface ActivityRecord {
  id: string;
  workspaceId: string;
  dealId: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'task' | 'note';
  title: string;
  description?: string;
  scheduledAt?: string;
  dueAt?: string;
  assigneeId?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  completedAt?: Date;
  overdue: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealListItem extends DealRecord {
  channel: Channel | null;
  daysInStage: number;
  slaStatus: SlaStatus;
}
