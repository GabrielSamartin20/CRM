import { z } from 'zod';

export const listConversationsQuerySchema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'spam']).optional(),
  agentId: z.string().optional(),
  channel: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const listMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50)
});

export const sendConversationMessageSchema = z.object({
  type: z.enum(['text', 'template', 'media']),
  content: z.record(z.unknown())
});

export const assignConversationSchema = z.object({
  agentId: z.string()
});

export const conversationStatusSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'spam'])
});
