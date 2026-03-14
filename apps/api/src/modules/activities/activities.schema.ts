import { z } from 'zod';

export const createActivitySchema = z.object({
  type: z.enum(['call', 'email', 'whatsapp', 'meeting', 'task', 'note']),
  title: z.string().min(2),
  description: z.string().optional(),
  scheduledAt: z.string().optional(),
  dueAt: z.string().optional(),
  assigneeId: z.string().optional()
});

export const updateActivitySchema = z.object({
  type: z.enum(['call', 'email', 'whatsapp', 'meeting', 'task', 'note']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  scheduledAt: z.string().optional(),
  dueAt: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional()
});
