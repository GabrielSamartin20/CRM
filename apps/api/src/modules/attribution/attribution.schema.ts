import { z } from 'zod';

export const attributionSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
  referrer: z.string().optional(),
  landingPage: z.string().optional(),
  sessionId: z.string().optional(),
  touchType: z.enum(['first', 'last']).default('first')
});

export const analyticsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  channel: z.string().optional(),
  campaignName: z.string().optional()
});
