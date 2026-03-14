export type MetaMessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contacts'
  | 'interactive'
  | 'reaction'
  | 'unsupported';

export interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string;
  changes: MetaWebhookChange[];
}

export interface MetaWebhookChange {
  field: string;
  value: MetaWebhookChangeValue;
}

export interface MetaWebhookChangeValue {
  messaging_product?: 'whatsapp';
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: MetaWebhookContactProfile[];
  messages?: MetaInboundMessage[];
  statuses?: MetaStatus[];
}

export interface MetaWebhookContactProfile {
  profile?: { name?: string };
  wa_id: string;
}

export interface MetaInboundMessageBase {
  from: string;
  id: string;
  timestamp: string;
  type: MetaMessageType;
}

export interface MetaTextMessage extends MetaInboundMessageBase {
  type: 'text';
  text: { body: string };
}
export interface MetaImageMessage extends MetaInboundMessageBase {
  type: 'image';
  image: { id: string; caption?: string };
}
export interface MetaAudioMessage extends MetaInboundMessageBase {
  type: 'audio';
  audio: { id: string };
}
export interface MetaVideoMessage extends MetaInboundMessageBase {
  type: 'video';
  video: { id: string; caption?: string };
}
export interface MetaDocumentMessage extends MetaInboundMessageBase {
  type: 'document';
  document: { id: string; filename?: string; caption?: string };
}
export interface MetaStickerMessage extends MetaInboundMessageBase {
  type: 'sticker';
  sticker: { id: string };
}
export interface MetaLocationMessage extends MetaInboundMessageBase {
  type: 'location';
  location: { latitude: number; longitude: number; name?: string };
}
export interface MetaContactsMessage extends MetaInboundMessageBase {
  type: 'contacts';
  contacts: Array<Record<string, unknown>>;
}
export interface MetaInteractiveMessage extends MetaInboundMessageBase {
  type: 'interactive';
  interactive: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}
export interface MetaReactionMessage extends MetaInboundMessageBase {
  type: 'reaction';
  reaction: { emoji: string; message_id: string };
}
export interface MetaUnsupportedMessage extends MetaInboundMessageBase {
  type: 'unsupported';
  [key: string]: unknown;
}

export type MetaInboundMessage =
  | MetaTextMessage
  | MetaImageMessage
  | MetaAudioMessage
  | MetaVideoMessage
  | MetaDocumentMessage
  | MetaStickerMessage
  | MetaLocationMessage
  | MetaContactsMessage
  | MetaInteractiveMessage
  | MetaReactionMessage
  | MetaUnsupportedMessage;

export interface MetaStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id?: string;
  errors?: Array<{ code?: number; title?: string }>;
}

export interface NormalizedInboundMessage {
  externalMessageId: string;
  from: string;
  timestamp: Date;
  type: MetaMessageType;
  content: Record<string, unknown>;
}
