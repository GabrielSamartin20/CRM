import { z } from 'zod';

export const whatsappVerificationQuerySchema = z.object({
  'hub.mode': z.string(),
  'hub.verify_token': z.string(),
  'hub.challenge': z.string()
});

export const whatsappWebhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            metadata: z
              .object({
                display_phone_number: z.string().optional(),
                phone_number_id: z.string().optional()
              })
              .optional(),
            contacts: z.array(z.object({ wa_id: z.string(), profile: z.object({ name: z.string().optional() }).optional() })).optional(),
            messages: z.array(z.record(z.unknown())).optional(),
            statuses: z
              .array(
                z.object({
                  id: z.string(),
                  status: z.enum(['sent', 'delivered', 'read', 'failed']),
                  timestamp: z.string(),
                  errors: z.array(z.object({ code: z.number().optional(), title: z.string().optional() })).optional()
                })
              )
              .optional()
          })
        })
      )
    })
  )
});

export const whatsappSendTextSchema = z.object({
  to: z.string(),
  text: z.string().min(1)
});

export const whatsappSendTemplateSchema = z.object({
  to: z.string(),
  templateName: z.string().min(1),
  langCode: z.string().min(2),
  components: z.array(z.record(z.unknown())).default([])
});

export const whatsappSendMediaSchema = z.object({
  to: z.string(),
  type: z.enum(['image', 'audio', 'video', 'document']),
  mediaId: z.string().optional(),
  link: z.string().url().optional(),
  caption: z.string().optional()
});
