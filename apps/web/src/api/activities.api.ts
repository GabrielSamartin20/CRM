import { ActivitiesByStatus, Activity } from '../types/kanban';
import { http } from './http';

export const activitiesApi = {
  getActivities(dealId: string): Promise<ActivitiesByStatus> {
    return http<ActivitiesByStatus>(`/api/v1/deals/${dealId}/activities`);
  },
  createActivity(
    dealId: string,
    data: {
      type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'task' | 'note';
      title: string;
      description?: string;
      scheduledAt?: string;
      dueAt?: string;
      assigneeId?: string;
    }
  ): Promise<Activity> {
    return http<Activity>(`/api/v1/deals/${dealId}/activities`, { method: 'POST', body: JSON.stringify(data) });
  },
  updateActivity(
    dealId: string,
    activityId: string,
    data: Partial<{
      type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'task' | 'note';
      title: string;
      description?: string;
      scheduledAt?: string;
      dueAt?: string;
      assigneeId?: string;
      status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    }>
  ): Promise<Activity> {
    return http<Activity>(`/api/v1/deals/${dealId}/activities/${activityId}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  deleteActivity(dealId: string, activityId: string): Promise<{ ok: boolean }> {
    return http<{ ok: boolean }>(`/api/v1/deals/${dealId}/activities/${activityId}`, { method: 'DELETE' });
  }
};
