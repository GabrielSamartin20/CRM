export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'spam';

export type MessageDirection = 'inbound' | 'outbound';

export type MessageLifecycleStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Contact {
  id: string;
  workspaceId: string;
  phoneE164: string;
  fullName: string | null;
  whatsappName: string | null;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  contactId: string;
  agentId: string | null;
  status: ConversationStatus;
  openedAt: Date;
  resolvedAt: Date | null;
  firstResponseAt: Date | null;
  lastMessageAt: Date | null;
}

export interface Message {
  id: string;
  workspaceId: string;
  conversationId: string;
  externalMessageId: string | null;
  direction: MessageDirection;
  type: string;
  status: MessageLifecycleStatus;
  content: Record<string, unknown>;
  sentAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface WorkspaceWhatsAppConfig {
  workspaceId: string;
  phoneNumberId: string;
  token: string;
}

export interface ConversationWithLastMessage extends Conversation {
  contact: Contact;
  lastMessage: Message | null;
  unreadCount: number;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
