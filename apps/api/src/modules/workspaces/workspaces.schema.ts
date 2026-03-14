import { z } from 'zod';

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().url().optional(),
  timezone: z.string().min(2).optional(),
  currency: z.string().min(2).optional(),
  language: z.string().min(2).optional()
});
