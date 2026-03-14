export type Channel = 'GOOGLE_ADS' | 'GOOGLE_ORGANIC' | 'META_ADS' | 'META_ORGANIC' | 'REFERRAL' | 'DIRECT' | 'EMAIL' | 'SMS' | 'OTHER';
export type SlaStatus = 'ok' | 'warning' | 'critical' | 'overdue';

export interface Contact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Stage {
  id: string;
  pipelineId: string;
  name: string;
  color: string;
  probability: number;
  order: number;
  type: 'OPEN' | 'CLOSED_WON' | 'CLOSED_LOST';
  slaHours?: number;
  dealsCount?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  order: number;
  stages: Stage[];
}

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  contact?: Contact;
  assigneeId?: string;
  assignee?: UserSummary;
  pipelineId: string;
  stageId: string;
  value?: number;
  currency: string;
  expectedCloseDate?: string;
  description?: string;
  tags: string[];
  channel: Channel | null;
  daysInStage: number;
  hoursInStage?: number;
  slaStatus: SlaStatus;
  pendingActivities?: number;
  utmSource?: string;
}

export interface DealStageHistory {
  id: string;
  fromStageId: string | null;
  toStageId: string;
  movedAt: string;
  movedBy: string;
  timeInPreviousStageSeconds?: number;
  reason?: string;
}

export interface Activity {
  id: string;
  dealId: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'task' | 'note';
  title: string;
  description?: string;
  scheduledAt?: string;
  dueAt?: string;
  assigneeId?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  completedAt?: string;
  overdue: boolean;
}

export interface DealDetail {
  deal: Deal;
  contact?: Contact;
  attribution?: { channel?: Channel; utmSource?: string; utmCampaign?: string };
  activities: Activity[];
  stageHistory: DealStageHistory[];
  timeline: Array<{ id: string; event: string; createdAt?: string; [key: string]: unknown }>;
}

export interface DealFilters {
  pipelineId?: string;
  stageId?: string;
  assigneeId?: string;
  contactId?: string;
  channel?: Channel;
  search?: string;
  minValue?: number;
  maxValue?: number;
  expectedCloseDate?: string;
  page?: number;
  limit?: number;
}

export interface DealsResponse {
  items: Deal[];
  total: number;
}

export interface ActivitiesByStatus {
  todo: Activity[];
  inProgress: Activity[];
  done: Activity[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(input: { status: number; code: string; message: string }) {
    super(input.message);
    this.status = input.status;
    this.code = input.code;
    this.name = 'ApiError';
  }
}
