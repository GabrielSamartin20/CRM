import { AppError } from '../../errors/app-error';
import { SocketGateway } from '../../events/socket.gateway';
import { DataRepository } from '../../lib/repositories';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

export class ConversationsService {
  constructor(
    private readonly deps: { repository: DataRepository; whatsappService: WhatsAppService; socketGateway: SocketGateway }
  ) {}

  async list(workspaceId: string, query: { status?: 'open' | 'pending' | 'resolved' | 'spam'; agentId?: string; channel?: string; page: number; limit: number }) {
    return this.deps.repository.listConversations({ workspaceId, ...query });
  }

  async getById(workspaceId: string, conversationId: string) {
    const conversation = await this.deps.repository.getConversationById(workspaceId, conversationId);
    if (!conversation) {
      throw new AppError({ statusCode: 404, code: 'CONVERSATION_NOT_FOUND', message: 'Conversa não encontrada' });
    }
    return conversation;
  }

  async listMessages(workspaceId: string, conversationId: string, query: { cursor?: string; limit: number }) {
    return this.deps.repository.listConversationMessages({ workspaceId, conversationId, ...query });
  }

  async sendMessage(
    workspaceId: string,
    conversationId: string,
    body: { type: 'text' | 'template' | 'media'; content: Record<string, unknown> }
  ) {
    const conversation = await this.getById(workspaceId, conversationId);
    const to = conversation.contact.phoneE164.replace('+', '');

    let externalMessageId = '';
    let messageType: string = body.type;

    if (body.type === 'text') {
      const text = String(body.content.text ?? '');
      externalMessageId = await this.deps.whatsappService.sendText(to, text, workspaceId);
    }

    if (body.type === 'template') {
      externalMessageId = await this.deps.whatsappService.sendTemplate(
        to,
        String(body.content.templateName ?? ''),
        String(body.content.langCode ?? 'pt_BR'),
        (body.content.components as Array<Record<string, unknown>>) ?? [],
        workspaceId
      );
    }

    if (body.type === 'media') {
      const mediaType = body.content.type as 'image' | 'audio' | 'video' | 'document';
      externalMessageId = await this.deps.whatsappService.sendMedia(
        to,
        mediaType,
        {
          mediaId: typeof body.content.mediaId === 'string' ? body.content.mediaId : undefined,
          link: typeof body.content.link === 'string' ? body.content.link : undefined
        },
        typeof body.content.caption === 'string' ? body.content.caption : undefined,
        workspaceId
      );
      messageType = mediaType;
    }

    const saved = await this.deps.repository.createMessage({
      workspaceId,
      conversationId,
      externalMessageId,
      direction: 'outbound',
      type: messageType,
      status: 'sent',
      content: body.content,
      sentAt: new Date()
    });

    if (!conversation.firstResponseAt) {
      await this.deps.repository.updateConversation(conversationId, {
        firstResponseAt: new Date()
      });
    }

    return saved;
  }

  async assign(workspaceId: string, conversationId: string, agentId: string) {
    const conversation = await this.getById(workspaceId, conversationId);
    const updated = await this.deps.repository.updateConversation(conversation.id, { agentId });

    this.deps.socketGateway.emitToWorkspace('conversation:assigned', workspaceId, {
      conversationId: updated.id,
      agentId
    });

    return updated;
  }

  async changeStatus(workspaceId: string, conversationId: string, status: 'open' | 'pending' | 'resolved' | 'spam') {
    const conversation = await this.getById(workspaceId, conversationId);
    const now = new Date();
    const patch =
      status === 'resolved'
        ? { status, resolvedAt: now }
        : {
            status,
            ...(conversation.resolvedAt ? { resolvedAt: null } : {})
          };

    const updated = await this.deps.repository.updateConversation(conversation.id, patch);

    this.deps.socketGateway.emitToWorkspace('conversation:status_changed', workspaceId, {
      conversationId: updated.id,
      status
    });

    return updated;
  }
}
