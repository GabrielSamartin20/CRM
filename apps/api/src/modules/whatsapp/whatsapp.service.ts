import { AppError } from '../../errors/app-error';
import { SocketGateway } from '../../events/socket.gateway';
import { DataRepository } from '../../lib/repositories';
import { env } from '../../lib/env';
import { whatsappOutboundQueue } from '../../queues/whatsapp.queue';
import { MetaInboundMessage, MetaStatus, NormalizedInboundMessage } from './whatsapp.types';

export class WhatsAppApiError extends AppError {
  constructor(input: { code: string; message: string; statusCode: number; details?: unknown }) {
    super({ statusCode: input.statusCode, code: input.code, message: input.message, details: input.details });
    this.name = 'WhatsAppApiError';
  }
}

export class WhatsAppService {
  constructor(private readonly deps: { repository: DataRepository; socketGateway: SocketGateway }) {}

  normalizeInboundMessage(message: MetaInboundMessage): NormalizedInboundMessage {
    const timestamp = new Date(Number(message.timestamp) * 1000);
    switch (message.type) {
      case 'text':
        return { externalMessageId: message.id, from: message.from, timestamp, type: 'text', content: { body: message.text.body } };
      case 'image':
        return {
          externalMessageId: message.id,
          from: message.from,
          timestamp,
          type: 'image',
          content: { mediaId: message.image.id, caption: message.image.caption ?? null }
        };
      case 'audio':
        return { externalMessageId: message.id, from: message.from, timestamp, type: 'audio', content: { mediaId: message.audio.id } };
      case 'video':
        return {
          externalMessageId: message.id,
          from: message.from,
          timestamp,
          type: 'video',
          content: { mediaId: message.video.id, caption: message.video.caption ?? null }
        };
      case 'document':
        return {
          externalMessageId: message.id,
          from: message.from,
          timestamp,
          type: 'document',
          content: {
            mediaId: message.document.id,
            filename: message.document.filename ?? null,
            caption: message.document.caption ?? null
          }
        };
      case 'sticker':
        return { externalMessageId: message.id, from: message.from, timestamp, type: 'sticker', content: { mediaId: message.sticker.id } };
      case 'location':
        return {
          externalMessageId: message.id,
          from: message.from,
          timestamp,
          type: 'location',
          content: {
            latitude: message.location.latitude,
            longitude: message.location.longitude,
            name: message.location.name ?? null
          }
        };
      case 'contacts':
        return { externalMessageId: message.id, from: message.from, timestamp, type: 'contacts', content: { contacts: message.contacts } };
      case 'interactive':
        return {
          externalMessageId: message.id,
          from: message.from,
          timestamp,
          type: 'interactive',
          content: {
            interactiveType: message.interactive.type,
            buttonReply: message.interactive.button_reply ?? null,
            listReply: message.interactive.list_reply ?? null
          }
        };
      case 'reaction':
        return {
          externalMessageId: message.id,
          from: message.from,
          timestamp,
          type: 'reaction',
          content: { emoji: message.reaction.emoji, messageId: message.reaction.message_id }
        };
      default:
        return {
          externalMessageId: message.id,
          from: message.from,
          timestamp,
          type: 'unsupported',
          content: { raw: message }
        };
    }
  }

  async processInboundMessages(input: {
    workspaceId: string;
    contacts: Array<{ wa_id: string; profile?: { name?: string } }>;
    messages: MetaInboundMessage[];
  }): Promise<void> {
    const contactsByWaId = new Map(input.contacts.map((contact) => [contact.wa_id, contact]));

    for (const message of input.messages) {
      const normalized = this.normalizeInboundMessage(message);
      const contactData = contactsByWaId.get(message.from);
      const contactName = contactData?.profile?.name ?? message.from;
      const contact = await this.deps.repository.upsertContactByPhone({
        workspaceId: input.workspaceId,
        phoneE164: `+${message.from}`,
        name: contactName
      });

      const existingOpenConversation = await this.deps.repository.findOpenConversationByContact(input.workspaceId, contact.id);
      const conversation =
        existingOpenConversation ??
        (await this.deps.repository.createConversation({
          workspaceId: input.workspaceId,
          contactId: contact.id,
          status: 'open'
        }));

      await this.deps.repository.updateConversation(conversation.id, {
        lastMessageAt: normalized.timestamp,
        status: conversation.status === 'resolved' ? 'open' : conversation.status
      });

      const savedMessage = await this.deps.repository.createMessage({
        workspaceId: input.workspaceId,
        conversationId: conversation.id,
        externalMessageId: normalized.externalMessageId,
        direction: 'inbound',
        type: normalized.type,
        status: 'delivered',
        content: normalized.content,
        sentAt: normalized.timestamp
      });

      this.deps.socketGateway.emitToWorkspace('conversation:new_message', input.workspaceId, {
        workspaceId: input.workspaceId,
        conversationId: conversation.id,
        message: savedMessage,
        contact
      });
    }
  }

  async processStatusUpdate(input: { workspaceId: string; status: MetaStatus }): Promise<void> {
    const found = await this.deps.repository.findMessageByExternalId(input.workspaceId, input.status.id);
    if (!found) {
      return;
    }

    const error = input.status.errors?.[0];
    const updated = await this.deps.repository.updateMessage(found.id, {
      status: input.status.status,
      errorCode: error?.code ? String(error.code) : null,
      errorMessage: error?.title ?? null
    });

    this.deps.socketGateway.emitToWorkspace('message:status_update', input.workspaceId, {
      messageId: updated.id,
      status: updated.status
    });
  }

  private async callMetaApi(phoneNumberId: string, payload: Record<string, unknown>): Promise<{ messages: Array<{ id: string }> }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const baseUrl = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const body = (await response.json().catch(() => ({}))) as {
        error?: { message?: string; code?: number };
        messages?: Array<{ id: string }>;
      };

      if (!response.ok) {
        const code = String(body.error?.code ?? response.status);
        const message = body.error?.message ?? 'Meta API error';

        if (code === '130429') {
          const retryAfter = Number(response.headers.get('Retry-After') ?? '2');
          await whatsappOutboundQueue.add(
            'whatsapp-outbound-retry',
            { workspaceId: 'unknown', request: { phoneNumberId, payload } },
            { delay: retryAfter * 1000 }
          );
        } else if (response.status >= 500 || response.status === 408) {
          await whatsappOutboundQueue.add('whatsapp-outbound-retry', {
            workspaceId: 'unknown',
            request: { phoneNumberId, payload }
          });
        }

        throw new WhatsAppApiError({ code, message, statusCode: response.status, details: body });
      }

      return { messages: body.messages ?? [] };
    } catch (error) {
      await whatsappOutboundQueue.add('whatsapp-outbound-retry', {
        workspaceId: 'unknown',
        request: { phoneNumberId, payload }
      });

      if (error instanceof WhatsAppApiError) {
        throw error;
      }
      throw new WhatsAppApiError({
        code: 'META_TIMEOUT',
        message: 'Falha ao chamar a API da Meta',
        statusCode: 503,
        details: error
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async sendText(to: string, text: string, workspaceId: string): Promise<string> {
    const workspaceConfig = await this.deps.repository.findWorkspaceById(workspaceId);
    if (!workspaceConfig) {
      throw new AppError({ statusCode: 404, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace não encontrado' });
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    };

    const response = await this.callMetaApi(workspaceConfig.phoneNumberId, payload);
    const wamid = response.messages[0]?.id ?? null;
    if (!wamid) {
      throw new AppError({ statusCode: 502, code: 'WHATSAPP_EMPTY_RESPONSE', message: 'Meta não retornou wamid' });
    }
    return wamid;
  }

  async sendTemplate(
    to: string,
    templateName: string,
    langCode: string,
    components: Array<Record<string, unknown>>,
    workspaceId: string
  ): Promise<string> {
    const workspaceConfig = await this.deps.repository.findWorkspaceById(workspaceId);
    if (!workspaceConfig) {
      throw new AppError({ statusCode: 404, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace não encontrado' });
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: langCode },
        components
      }
    };

    const response = await this.callMetaApi(workspaceConfig.phoneNumberId, payload);
    return response.messages[0]?.id ?? '';
  }

  async sendMedia(
    to: string,
    type: 'image' | 'audio' | 'video' | 'document',
    mediaSource: { mediaId?: string; link?: string },
    caption: string | undefined,
    workspaceId: string
  ): Promise<string> {
    const workspaceConfig = await this.deps.repository.findWorkspaceById(workspaceId);
    if (!workspaceConfig) {
      throw new AppError({ statusCode: 404, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace não encontrado' });
    }

    const payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to,
      type,
      [type]: {
        ...(mediaSource.mediaId ? { id: mediaSource.mediaId } : {}),
        ...(mediaSource.link ? { link: mediaSource.link } : {}),
        ...(caption ? { caption } : {})
      }
    };

    const response = await this.callMetaApi(workspaceConfig.phoneNumberId, payload);
    return response.messages[0]?.id ?? '';
  }

  async markAsRead(messageId: string, workspaceId: string): Promise<void> {
    const workspaceConfig = await this.deps.repository.findWorkspaceById(workspaceId);
    if (!workspaceConfig) {
      throw new AppError({ statusCode: 404, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace não encontrado' });
    }

    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    };

    await this.callMetaApi(workspaceConfig.phoneNumberId, payload);
  }
}
