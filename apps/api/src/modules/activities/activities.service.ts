import { randomUUID } from 'node:crypto';
import { AppError } from '../../lib/errors';
import { ActivityRecord } from '../deals/deals.types';
import { kanbanStore } from '../deals/deals.service';

export class ActivitiesService {
  list(workspaceId: string, dealId: string): { todo: ActivityRecord[]; inProgress: ActivityRecord[]; done: ActivityRecord[] } {
    const activities = Array.from(kanbanStore.activities.values()).filter((activity) => activity.workspaceId === workspaceId && activity.dealId === dealId);
    return {
      todo: activities.filter((activity) => activity.status === 'TODO'),
      inProgress: activities.filter((activity) => activity.status === 'IN_PROGRESS'),
      done: activities.filter((activity) => activity.status === 'DONE')
    };
  }

  create(workspaceId: string, dealId: string, body: {
    type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'task' | 'note';
    title: string;
    description?: string;
    scheduledAt?: string;
    dueAt?: string;
    assigneeId?: string;
  }): ActivityRecord {
    const activity: ActivityRecord = {
      id: randomUUID(),
      workspaceId,
      dealId,
      type: body.type,
      title: body.title,
      description: body.description,
      scheduledAt: body.scheduledAt,
      dueAt: body.dueAt,
      assigneeId: body.assigneeId,
      status: 'TODO',
      overdue: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    kanbanStore.activities.set(activity.id, activity);
    return activity;
  }

  update(workspaceId: string, dealId: string, activityId: string, body: {
    type?: 'call' | 'email' | 'whatsapp' | 'meeting' | 'task' | 'note';
    title?: string;
    description?: string;
    scheduledAt?: string;
    dueAt?: string;
    assigneeId?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  }): ActivityRecord {
    const activity = kanbanStore.activities.get(activityId);
    if (!activity || activity.workspaceId !== workspaceId || activity.dealId !== dealId) {
      throw new AppError({ statusCode: 404, code: 'ACTIVITY_NOT_FOUND', message: 'Atividade não encontrada' });
    }

    const now = new Date();
    const overdue = body.scheduledAt ? new Date(body.scheduledAt).getTime() < now.getTime() && body.status !== 'DONE' : activity.overdue;
    const completedAt = body.status === 'DONE' ? now : activity.completedAt;

    const updated: ActivityRecord = { ...activity, ...body, overdue, completedAt, updatedAt: now };
    kanbanStore.activities.set(activityId, updated);
    return updated;
  }

  remove(workspaceId: string, dealId: string, activityId: string): void {
    const activity = kanbanStore.activities.get(activityId);
    if (!activity || activity.workspaceId !== workspaceId || activity.dealId !== dealId) {
      throw new AppError({ statusCode: 404, code: 'ACTIVITY_NOT_FOUND', message: 'Atividade não encontrada' });
    }
    kanbanStore.activities.delete(activityId);
  }
}
