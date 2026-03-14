import { Job } from 'bullmq';
import { createWhatsAppInboundProcessor } from '../whatsapp.processor';
import { InMemoryRepository } from '../../../lib/repositories';

const socketEvents: Array<{ event: string; workspaceId: string; payload: Record<string, unknown> }> = [];

const socketGateway = {
  io: null as never,
  emitToWorkspace: (event: string, workspaceId: string, payload: Record<string, unknown>) => {
    socketEvents.push({ event, workspaceId, payload });
  }
};

describe('WhatsApp processor', () => {
  beforeEach(() => {
    socketEvents.length = 0;
  });

  it('deve criar contato novo ao receber primeira mensagem', async () => {
    const repository = new InMemoryRepository({
      workspaces: [{ workspaceId: 'ws1', phoneNumberId: '1234567890', token: 'token' }]
    });
    const processor = createWhatsAppInboundProcessor({ repository, socketGateway });

    const job = {
      data: {
        entry: { id: 'entry', changes: [] },
        changeField: 'messages',
        changeValue: {
          metadata: { phone_number_id: '1234567890' },
          contacts: [{ wa_id: '5511999999999', profile: { name: 'Novo Lead' } }],
          messages: [
            {
              from: '5511999999999',
              id: 'wamid.1',
              timestamp: '1710000000',
              type: 'text',
              text: { body: 'Olá' }
            }
          ]
        }
      }
    } as Job;

    await processor.handle(job as Job);

    const list = await repository.listConversations({ workspaceId: 'ws1', page: 1, limit: 20 });
    expect(list.items).toHaveLength(1);
    expect(list.items[0].contact.fullName).toBe('Novo Lead');
  });

  it('deve reaproveitar contato existente pelo telefone', async () => {
    const repository = new InMemoryRepository({
      workspaces: [{ workspaceId: 'ws1', phoneNumberId: '1234567890', token: 'token' }]
    });
    await repository.upsertContactByPhone({ workspaceId: 'ws1', phoneE164: '+5511777777777', name: 'Contato Antigo' });

    const processor = createWhatsAppInboundProcessor({ repository, socketGateway });

    const job = {
      data: {
        entry: { id: 'entry', changes: [] },
        changeField: 'messages',
        changeValue: {
          metadata: { phone_number_id: '1234567890' },
          contacts: [{ wa_id: '5511777777777', profile: { name: 'Contato Atualizado' } }],
          messages: [
            {
              from: '5511777777777',
              id: 'wamid.2',
              timestamp: '1710000010',
              type: 'text',
              text: { body: 'Oi' }
            }
          ]
        }
      }
    } as Job;

    await processor.handle(job as Job);
    const list = await repository.listConversations({ workspaceId: 'ws1', page: 1, limit: 20 });
    expect(list.items[0].contact.fullName).toBe('Contato Atualizado');
  });

  it('deve abrir nova conversa se não existe aberta', async () => {
    const repository = new InMemoryRepository({
      workspaces: [{ workspaceId: 'ws1', phoneNumberId: '1234567890', token: 'token' }]
    });
    const processor = createWhatsAppInboundProcessor({ repository, socketGateway });

    const baseJob = {
      data: {
        entry: { id: 'entry', changes: [] },
        changeField: 'messages',
        changeValue: {
          metadata: { phone_number_id: '1234567890' },
          contacts: [{ wa_id: '5511666666666', profile: { name: 'Lead' } }],
          messages: [
            {
              from: '5511666666666',
              id: 'wamid.3',
              timestamp: '1710000020',
              type: 'text',
              text: { body: 'Primeira' }
            }
          ]
        }
      }
    } as Job;

    await processor.handle(baseJob as Job);
    const firstConversationId = (await repository.listConversations({ workspaceId: 'ws1', page: 1, limit: 20 })).items[0].id;
    await repository.updateConversation(firstConversationId, { status: 'resolved' });

    const secondJob = {
      ...baseJob,
      data: {
        ...baseJob.data,
        changeValue: {
          ...baseJob.data.changeValue,
          messages: [
            {
              from: '5511666666666',
              id: 'wamid.4',
              timestamp: '1710000030',
              type: 'text',
              text: { body: 'Reabriu' }
            }
          ]
        }
      }
    } as Job;

    await processor.handle(secondJob as Job);
    const list = await repository.listConversations({ workspaceId: 'ws1', page: 1, limit: 20 });
    expect(list.total).toBe(2);
  });

  it('deve atualizar status da mensagem ao receber status read', async () => {
    const repository = new InMemoryRepository({
      workspaces: [{ workspaceId: 'ws1', phoneNumberId: '1234567890', token: 'token' }]
    });

    const contact = await repository.upsertContactByPhone({ workspaceId: 'ws1', phoneE164: '+5511555555555', name: 'Contato' });
    const conversation = await repository.createConversation({ workspaceId: 'ws1', contactId: contact.id, status: 'open' });
    const message = await repository.createMessage({
      workspaceId: 'ws1',
      conversationId: conversation.id,
      externalMessageId: 'wamid.status',
      direction: 'outbound',
      type: 'text',
      status: 'sent',
      content: { body: 'teste' },
      sentAt: new Date()
    });

    const processor = createWhatsAppInboundProcessor({ repository, socketGateway });

    const job = {
      data: {
        entry: { id: 'entry-status', changes: [] },
        changeField: 'messages',
        changeValue: {
          metadata: { phone_number_id: '1234567890' },
          statuses: [
            {
              id: 'wamid.status',
              status: 'read',
              timestamp: '1710000040'
            }
          ]
        }
      }
    } as Job;

    await processor.handle(job as Job);

    const updated = await repository.findMessageById('ws1', message.id);
    expect(updated?.status).toBe('read');
  });
});
