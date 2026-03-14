import { z } from 'zod';

export const createStageSchema = z.object({
  name: z.string().min(2),
  color: z.string().min(4),
  probability: z.coerce.number().min(0).max(100),
  order: z.coerce.number().int().nonnegative(),
  slaHours: z.coerce.number().positive().optional(),
  type: z.enum(['OPEN', 'CLOSED_WON', 'CLOSED_LOST']).optional()
});

export const updateStageSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  slaHours: z.coerce.number().positive().optional(),
  type: z.enum(['OPEN', 'CLOSED_WON', 'CLOSED_LOST']).optional()
});

export const reorderStagesSchema = z.object({
  stages: z.array(
    z.object({
      id: z.string().min(1),
      order: z.coerce.number().int().nonnegative()
    })
  )
});
