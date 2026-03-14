import { z } from 'zod';

export const listDealsQuerySchema = z.object({
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  assigneeId: z.string().optional(),
  contactId: z.string().optional(),
  channel: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const createDealSchema = z.object({
  title: z.string().min(2),
  contactId: z.string().min(1),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1),
  value: z.coerce.number().optional(),
  currency: z.string().default('BRL'),
  expectedCloseDate: z.string().optional(),
  assigneeId: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export const updateDealSchema = z.object({
  title: z.string().optional(),
  contactId: z.string().optional(),
  pipelineId: z.string().optional(),
  assigneeId: z.string().optional(),
  value: z.coerce.number().optional(),
  currency: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const moveDealSchema = z.object({
  stageId: z.string().min(1),
  reason: z.string().optional()
});
