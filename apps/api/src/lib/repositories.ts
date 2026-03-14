import { randomUUID } from 'node:crypto';
import {
  Contact,
  Conversation,
  ConversationStatus,
  ConversationWithLastMessage,
  CursorPage,
  Message,
  MessageLifecycleStatus,
  WorkspaceWhatsAppConfig
} from '../types/domain';

export interface CreateMessageInput {
  workspaceId: string;
  conversationId: string;
  externalMessageId: string | null;
  direction: 'inbound' | 'outbound';
  type: string;
  status: MessageLifecycleStatus;
  content: Record<string, unknown>;
  sentAt: Date | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface DataRepository {
  findWorkspaceByPhoneNumberId(phoneNumberId: string): Promise<WorkspaceWhatsAppConfig | null>;
  findWorkspaceById(workspaceId: string): Promise<WorkspaceWhatsAppConfig | null>;
  upsertContactByPhone(input: {
    workspaceId: string;
    phoneE164: string;
    name: string;
  }): Promise<Contact>;
  findOpenConversationByContact(workspaceId: string, contactId: string): Promise<Conversation | null>;
  createConversation(input: {
    workspaceId: string;
    contactId: string;
    status: ConversationStatus;
  }): Promise<Conversation>;
  updateConversation(conversationId: string, patch: Partial<Conversation>): Promise<Conversation>;
  createMessage(input: CreateMessageInput): Promise<Message>;
  findMessageByExternalId(workspaceId: string, externalId: string): Promise<Message | null>;
  findMessageById(workspaceId: string, messageId: string): Promise<Message | null>;
  updateMessage(messageId: string, patch: Partial<Message>): Promise<Message>;
  listConversations(input: {
    workspaceId: string;
    status?: ConversationStatus;
    agentId?: string;
    channel?: string;
    page: number;
    limit: number;
  }): Promise<{ items: ConversationWithLastMessage[]; total: number }>;
  getConversationById(workspaceId: string, conversationId: string): Promise<ConversationWithLastMessage | null>;
  listConversationMessages(input: {
    workspaceId: string;
    conversationId: string;
    cursor?: string;
    limit: number;
  }): Promise<CursorPage<Message>>;
}

export class InMemoryRepository implements DataRepository {
  private readonly workspaceConfigs = new Map<string, WorkspaceWhatsAppConfig>();
  private readonly contacts = new Map<string, Contact>();
  private readonly conversations = new Map<string, Conversation>();
  private readonly messages = new Map<string, Message>();

  constructor(seed?: { workspaces?: WorkspaceWhatsAppConfig[] }) {
    seed?.workspaces?.forEach((workspace) => this.workspaceConfigs.set(workspace.workspaceId, workspace));
  }

  async findWorkspaceByPhoneNumberId(phoneNumberId: string): Promise<WorkspaceWhatsAppConfig | null> {
    for (const value of this.workspaceConfigs.values()) {
      if (value.phoneNumberId === phoneNumberId) {
        return value;
      }
    }
    return null;
  }

  async findWorkspaceById(workspaceId: string): Promise<WorkspaceWhatsAppConfig | null> {
    return this.workspaceConfigs.get(workspaceId) ?? null;
  }

  async upsertContactByPhone(input: { workspaceId: string; phoneE164: string; name: string }): Promise<Contact> {
    const key = `${input.workspaceId}:${input.phoneE164}`;
    const found = Array.from(this.contacts.values()).find(
      (contact) => contact.workspaceId === input.workspaceId && contact.phoneE164 === input.phoneE164
    );

    if (found) {
      const updated: Contact = {
        ...found,
        fullName: input.name,
        whatsappName: input.name
      };
      this.contacts.set(found.id, updated);
      return updated;
    }

    const created: Contact = {
      id: key,
      workspaceId: input.workspaceId,
      phoneE164: input.phoneE164,
      fullName: input.name,
      whatsappName: input.name
    };
    this.contacts.set(created.id, created);
    return created;
  }

  async findOpenConversationByContact(workspaceId: string, contactId: string): Promise<Conversation | null> {
    const found = Array.from(this.conversations.values()).find(
      (conversation) =>
        conversation.workspaceId === workspaceId &&
        conversation.contactId === contactId &&
        (conversation.status === 'open' || conversation.status === 'pending')
    );
    return found ?? null;
  }

  async createConversation(input: { workspaceId: string; contactId: string; status: ConversationStatus }): Promise<Conversation> {
    const created: Conversation = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      contactId: input.contactId,
      agentId: null,
      status: input.status,
      openedAt: new Date(),
      resolvedAt: null,
      firstResponseAt: null,
      lastMessageAt: null
    };
    this.conversations.set(created.id, created);
    return created;
  }

  async updateConversation(conversationId: string, patch: Partial<Conversation>): Promise<Conversation> {
    const found = this.conversations.get(conversationId);
    if (!found) {
      throw new Error('Conversation not found');
    }
    const updated = { ...found, ...patch };
    this.conversations.set(conversationId, updated);
    return updated;
  }

  async createMessage(input: CreateMessageInput): Promise<Message> {
    const created: Message = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      externalMessageId: input.externalMessageId,
      direction: input.direction,
      type: input.type,
      status: input.status,
      content: input.content,
      sentAt: input.sentAt,
      errorCode: input.errorCode ?? null,
      errorMessage: input.errorMessage ?? null,
      createdAt: new Date()
    };
    this.messages.set(created.id, created);
    return created;
  }

  async findMessageByExternalId(workspaceId: string, externalId: string): Promise<Message | null> {
    const found = Array.from(this.messages.values()).find(
      (message) => message.workspaceId === workspaceId && message.externalMessageId === externalId
    );
    return found ?? null;
  }

  async findMessageById(workspaceId: string, messageId: string): Promise<Message | null> {
    const found = this.messages.get(messageId);
    if (!found || found.workspaceId !== workspaceId) {
      return null;
    }
    return found;
  }

  async updateMessage(messageId: string, patch: Partial<Message>): Promise<Message> {
    const found = this.messages.get(messageId);
    if (!found) {
      throw new Error('Message not found');
    }
    const updated = { ...found, ...patch };
    this.messages.set(messageId, updated);
    return updated;
  }

  async listConversations(input: {
    workspaceId: string;
    status?: ConversationStatus;
    agentId?: string;
    channel?: string;
    page: number;
    limit: number;
  }): Promise<{ items: ConversationWithLastMessage[]; total: number }> {
    const filtered = Array.from(this.conversations.values()).filter((conversation) => {
      if (conversation.workspaceId !== input.workspaceId) return false;
      if (input.status && conversation.status !== input.status) return false;
      if (input.agentId && conversation.agentId !== input.agentId) return false;
      return true;
    });

    const ordered = filtered.sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0));
    const start = (input.page - 1) * input.limit;
    const paged = ordered.slice(start, start + input.limit);

    const items = paged.map((conversation) => {
      const contact = this.contacts.get(conversation.contactId);
      if (!contact) {
        throw new Error('Contact not found for conversation');
      }
      const lastMessage = Array.from(this.messages.values())
        .filter((message) => message.conversationId === conversation.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;

      return {
        ...conversation,
        contact,
        lastMessage,
        unreadCount: 0
      };
    });

    return { items, total: filtered.length };
  }

  async getConversationById(workspaceId: string, conversationId: string): Promise<ConversationWithLastMessage | null> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || conversation.workspaceId !== workspaceId) {
      return null;
    }
    const contact = this.contacts.get(conversation.contactId);
    if (!contact) {
      return null;
    }
    const lastMessage = Array.from(this.messages.values())
      .filter((message) => message.conversationId === conversation.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
    return { ...conversation, contact, lastMessage, unreadCount: 0 };
  }

  async listConversationMessages(input: {
    workspaceId: string;
    conversationId: string;
    cursor?: string;
    limit: number;
  }): Promise<CursorPage<Message>> {
    const all = Array.from(this.messages.values())
      .filter((message) => message.workspaceId === input.workspaceId && message.conversationId === input.conversationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const startIndex = input.cursor ? all.findIndex((message) => message.id === input.cursor) + 1 : 0;
    const items = all.slice(startIndex, startIndex + input.limit);
    const nextCursor = items.length === input.limit ? items[items.length - 1].id : null;

    return { items, nextCursor };
  }
}
