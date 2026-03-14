import request from 'supertest';
import { buildApp } from '../../../app';

describe('Attribution API', () => {
  it('POST sem X-Workspace-Token → 401', async () => {
    const app = buildApp();
    const response = await request(app.server).post('/api/v1/attribution').send({ phone: '+55119999' });
    expect(response.status).toBe(401);
  });

  it('POST com token inválido → 401', async () => {
    const app = buildApp();
    const response = await request(app.server).post('/api/v1/attribution').set('X-Workspace-Token', 'wt_invalid').send({ phone: '+55119999' });
    expect(response.status).toBe(401);
  });

  it('POST válido cria contato + attribution', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Attr1',
      ownerName: 'Owner',
      email: 'attr1@crm.com',
      password: 'StrongPass#1'
    });

    const tokenData = await request(app.server)
      .get('/api/v1/workspaces/current/public-token')
      .set('Authorization', `Bearer ${register.body.accessToken}`);

    const response = await request(app.server)
      .post('/api/v1/attribution')
      .set('X-Workspace-Token', tokenData.body.token)
      .send({ phone: '+5511999999999', utmSource: 'google', utmMedium: 'cpc' });

    expect(response.status).toBe(200);
    expect(response.body.contactId).toBeTruthy();
    expect(response.body.channel).toBe('GOOGLE_ADS');
  });

  it('POST second touch (first-touch model) não sobrescreve primeiro', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Attr2',
      ownerName: 'Owner',
      email: 'attr2@crm.com',
      password: 'StrongPass#1'
    });
    const tokenData = await request(app.server)
      .get('/api/v1/workspaces/current/public-token')
      .set('Authorization', `Bearer ${register.body.accessToken}`);

    const first = await request(app.server)
      .post('/api/v1/attribution')
      .set('X-Workspace-Token', tokenData.body.token)
      .send({ email: 'lead@x.com', utmSource: 'google', utmMedium: 'organic', touchType: 'first' });

    await request(app.server)
      .post('/api/v1/attribution')
      .set('X-Workspace-Token', tokenData.body.token)
      .send({ email: 'lead@x.com', utmSource: 'facebook', touchType: 'first' });

    const read = await request(app.server)
      .get(`/api/v1/attribution/${first.body.contactId}`)
      .set('Authorization', `Bearer ${register.body.accessToken}`);

    expect(read.body.attribution.channel).toBe('GOOGLE_ORGANIC');
  });

  it('POST second touch (last-touch model) sobrescreve', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Attr3',
      ownerName: 'Owner',
      email: 'attr3@crm.com',
      password: 'StrongPass#1'
    });
    const tokenData = await request(app.server)
      .get('/api/v1/workspaces/current/public-token')
      .set('Authorization', `Bearer ${register.body.accessToken}`);

    const first = await request(app.server)
      .post('/api/v1/attribution')
      .set('X-Workspace-Token', tokenData.body.token)
      .send({ email: 'lead2@x.com', utmSource: 'google', utmMedium: 'organic', touchType: 'first' });

    await request(app.server)
      .post('/api/v1/attribution')
      .set('X-Workspace-Token', tokenData.body.token)
      .send({ email: 'lead2@x.com', utmSource: 'facebook', touchType: 'last' });

    const read = await request(app.server)
      .get(`/api/v1/attribution/${first.body.contactId}`)
      .set('Authorization', `Bearer ${register.body.accessToken}`);

    expect(read.body.attribution.channel).toBe('META_ORGANIC');
  });
});
