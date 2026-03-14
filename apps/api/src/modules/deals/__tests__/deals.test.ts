import request from 'supertest';
import { buildApp } from '../../../app';
import { kanbanStore } from '../deals.service';
import { StagesService } from '../../stages/stages.service';

describe('Deals module', () => {
  beforeEach(() => {
    kanbanStore.deals.clear();
    kanbanStore.pipelines.clear();
    kanbanStore.stages.clear();
    kanbanStore.stageHistory.length = 0;
  });

  it('Criar deal → retornar com stage e contact', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({ workspaceName: 'kanbanA', ownerName: 'A', email: 'a@k.com', password: 'StrongPass#1' });

    const pipeline = await request(app.server).post('/api/v1/pipelines').set('Authorization', `Bearer ${register.body.accessToken}`).send({ name: 'Vendas' });
    const stageId = pipeline.body.id ? Array.from(kanbanStore.stages.values()).find((s) => s.pipelineId === pipeline.body.id)?.id : undefined;

    const deal = await request(app.server)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ title: 'Deal 1', contactId: 'c1', pipelineId: pipeline.body.id, stageId, currency: 'BRL' });

    expect(deal.status).toBe(201);
    expect(deal.body.stageId).toBe(stageId);
  });

  it('Mover deal → criar DealStageHistory', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({ workspaceName: 'kanbanB', ownerName: 'B', email: 'b@k.com', password: 'StrongPass#1' });
    const token = register.body.accessToken as string;

    const pipeline = await request(app.server).post('/api/v1/pipelines').set('Authorization', `Bearer ${token}`).send({ name: 'Vendas' });
    const stages = Array.from(kanbanStore.stages.values()).filter((s) => s.pipelineId === pipeline.body.id).sort((a, b) => a.order - b.order);

    const deal = await request(app.server)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Deal 2', contactId: 'c2', pipelineId: pipeline.body.id, stageId: stages[0].id, currency: 'BRL' });

    await request(app.server)
      .patch(`/api/v1/deals/${deal.body.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stageId: stages[1].id });

    expect(kanbanStore.stageHistory.filter((h) => h.dealId === deal.body.id).length).toBe(2);
  });

  it('Mover para WON → preencher wonAt', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({ workspaceName: 'kanbanC', ownerName: 'C', email: 'c@k.com', password: 'StrongPass#1' });
    const token = register.body.accessToken as string;

    const pipeline = await request(app.server).post('/api/v1/pipelines').set('Authorization', `Bearer ${token}`).send({ name: 'Vendas' });
    const stages = Array.from(kanbanStore.stages.values()).filter((s) => s.pipelineId === pipeline.body.id);
    const won = stages.find((s) => s.type === 'CLOSED_WON');
    const open = stages.find((s) => s.type === 'OPEN');

    const deal = await request(app.server)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Deal 3', contactId: 'c3', pipelineId: pipeline.body.id, stageId: open?.id, currency: 'BRL', value: 100 });

    const moved = await request(app.server)
      .patch(`/api/v1/deals/${deal.body.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stageId: won?.id });

    expect(Boolean(moved.body.wonAt)).toBe(true);
  });

  it('GET /deals com filtro de channel → retornar apenas do canal', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({ workspaceName: 'kanbanD', ownerName: 'D', email: 'd@k.com', password: 'StrongPass#1' });
    const token = register.body.accessToken as string;

    const publicToken = await request(app.server).get('/api/v1/workspaces/current/public-token').set('Authorization', `Bearer ${token}`);
    const pipeline = await request(app.server).post('/api/v1/pipelines').set('Authorization', `Bearer ${token}`).send({ name: 'Vendas' });
    const stage = Array.from(kanbanStore.stages.values()).find((s) => s.pipelineId === pipeline.body.id);

    await request(app.server).post('/api/v1/attribution').set('X-Workspace-Token', publicToken.body.token).send({ email: 'x@x.com', utmSource: 'google', utmMedium: 'cpc' });
    await request(app.server).post('/api/v1/attribution').set('X-Workspace-Token', publicToken.body.token).send({ email: 'y@y.com', utmSource: 'facebook' });

    await request(app.server)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Google', contactId: Array.from((await import('../../attribution/attribution.service')).attributionStore.contacts.values()).find((c) => c.email === 'x@x.com')?.id, pipelineId: pipeline.body.id, stageId: stage?.id, currency: 'BRL' });

    await request(app.server)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Meta', contactId: Array.from((await import('../../attribution/attribution.service')).attributionStore.contacts.values()).find((c) => c.email === 'y@y.com')?.id, pipelineId: pipeline.body.id, stageId: stage?.id, currency: 'BRL' });

    const filtered = await request(app.server).get('/api/v1/deals?channel=GOOGLE_ADS').set('Authorization', `Bearer ${token}`);
    expect(filtered.body.items.length).toBe(1);
  });

  it('SLA warning após 24h sem movimentação (mock Date)', async () => {
    const stageService = new StagesService();
    const stage = stageService.create('ws-sla', 'pipe-sla', { name: 'SLA', color: '#000', probability: 10, order: 0 });
    kanbanStore.deals.set('deal-sla', {
      id: 'deal-sla',
      workspaceId: 'ws-sla',
      title: 'SLA',
      contactId: 'c',
      pipelineId: 'pipe-sla',
      stageId: stage.id,
      currency: 'BRL',
      tags: [],
      status: 'OPEN',
      stageEnteredAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const service = (await import('../deals.service')).DealsService;
    const list = new service().list('ws-sla', { page: 1, limit: 20 });
    expect(list.items[0].slaStatus).toBe('warning');
  });

  it('Reordenar stages em transação atômica', async () => {
    const stageService = new StagesService();
    const s1 = stageService.create('ws-r', 'pipe-r', { name: 'A', color: '#000', probability: 10, order: 0 });
    const s2 = stageService.create('ws-r', 'pipe-r', { name: 'B', color: '#000', probability: 20, order: 1 });

    stageService.reorder('ws-r', 'pipe-r', { stages: [{ id: s1.id, order: 1 }, { id: s2.id, order: 0 }] });
    expect(kanbanStore.stages.get(s1.id)?.order).toBe(1);
    expect(kanbanStore.stages.get(s2.id)?.order).toBe(0);
  });
});
