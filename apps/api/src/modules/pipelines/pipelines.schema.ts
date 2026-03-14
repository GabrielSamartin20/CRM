import { z } from 'zod';

export const createPipelineSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
});

export const updatePipelineSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional()
});

export const reorderPipelinesSchema = z.object({
  pipelines: z.array(
    z.object({
      id: z.string().min(1),
      order: z.coerce.number().int().nonnegative()
    })
  )
});
