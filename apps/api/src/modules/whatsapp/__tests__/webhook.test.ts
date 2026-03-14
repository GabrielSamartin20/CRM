import request from 'supertest';
import { buildApp } from '../../../app';
import { env } from '../../../lib/env';
import { computeMetaSignature } from '../whatsapp.crypto';

const mockAdd = jest.fn();

jest.mock('../../../queues/whatsapp.queue', () => ({
  whatsappInboundQueue: {
    add: (...args: unknown[]) => mockAdd(...args)
  }
}));

const payload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'entry-1',
      changes: [
        {
          field: 'messages',
          value: {
            metadata: { phone_number_id: '1234567890' },
            contacts: [{ wa_id: '5511999999999', profile: { name: 'Cliente Teste' } }],
            messages: [
              {
                from: '5511999999999',
                id: 'wamid.123',
                timestamp: '1710000000',
                type: 'unsupported'
              }
            ]
          }
        }
      ]
    }
  ]
};

describe('WhatsApp webhook', () => {
  beforeEach(() => {
    mockAdd.mockReset().mockResolvedValue(undefined);
  });

  it('deve retornar hub.challenge com verify_token correto', async () => {
    const app = buildApp();
    const response = await request(app.server).get('/api/v1/webhooks/whatsapp').query({
      'hub.mode': 'subscribe',
      'hub.verify_token': env.WHATSAPP_VERIFY_TOKEN,
      'hub.challenge': 'abc123'
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe('abc123');
  });

  it('deve retornar 403 com verify_token errado', async () => {
    const app = buildApp();
    const response = await request(app.server).get('/api/v1/webhooks/whatsapp').query({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong',
      'hub.challenge': 'abc123'
    });

    expect(response.status).toBe(403);
  });

  it('deve retornar 401 com assinatura HMAC inválida', async () => {
    const app = buildApp();
    const response = await request(app.server)
      .post('/api/v1/webhooks/whatsapp')
      .set('x-hub-signature-256', 'sha256=invalid')
      .send(payload);

    expect(response.status).toBe(401);
  });

  it('deve retornar 200 e enfileirar job com payload válido', async () => {
    const app = buildApp();
    const raw = JSON.stringify(payload);
    const signature = computeMetaSignature(raw, env.WHATSAPP_APP_SECRET);

    const response = await request(app.server)
      .post('/api/v1/webhooks/whatsapp')
      .set('content-type', 'application/json')
      .set('x-hub-signature-256', signature)
      .send(raw);

    expect(response.status).toBe(200);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it('deve ignorar graciosamente tipo de mensagem desconhecido', async () => {
    const app = buildApp();
    const customPayload = {
      ...payload,
      entry: [
        {
          id: 'entry-2',
          changes: [
            {
              field: 'messages',
              value: {
                metadata: { phone_number_id: '1234567890' },
                contacts: [{ wa_id: '5511888888888', profile: { name: 'Outro Cliente' } }],
                messages: [
                  {
                    from: '5511888888888',
                    id: 'wamid.unknown',
                    timestamp: '1710000001',
                    type: 'unsupported'
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    const raw = JSON.stringify(customPayload);
    const signature = computeMetaSignature(raw, env.WHATSAPP_APP_SECRET);

    const response = await request(app.server)
      .post('/api/v1/webhooks/whatsapp')
      .set('content-type', 'application/json')
      .set('x-hub-signature-256', signature)
      .send(raw);

    expect(response.status).toBe(200);
  });
});
