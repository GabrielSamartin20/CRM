import request from 'supertest';
import { buildApp } from '../../../app';

describe('Auth guards', () => {
  it('Rota protegida sem token → 401', async () => {
    const app = buildApp();
    const response = await request(app.server).get('/api/v1/users/me');
    expect(response.status).toBe(401);
  });

  it('Rota protegida com token expirado → 401', async () => {
    const app = buildApp();
    const response = await request(app.server).get('/api/v1/users/me').set('Authorization', 'Bearer expired.token');
    expect(response.status).toBe(401);
  });

  it('Rota ADMIN acessada por AGENT → 403', async () => {
    const app = buildApp();
    const owner = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Kappa',
      ownerName: 'Owner',
      email: 'owner@kappa.com',
      password: 'StrongPass#1'
    });
    const invite = await request(app.server)
      .post('/api/v1/users/invite')
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .send({ email: 'agent@kappa.com', role: 'AGENT' });

    await request(app.server).post('/api/v1/users/accept-invite').send({ token: invite.body.token, password: 'StrongPass#1', name: 'Agent' });

    const login = await request(app.server).post('/api/v1/auth/login').send({ email: 'agent@kappa.com', password: 'StrongPass#1' });
    const response = await request(app.server)
      .post('/api/v1/users/invite')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ email: 'x@x.com', role: 'AGENT' });

    expect(response.status).toBe(403);
  });

  it('Rota de workspace A acessada por user do workspace B → 403', async () => {
    const app = buildApp();
    const wsA = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Lambda A',
      ownerName: 'Owner A',
      email: 'a@lambda.com',
      password: 'StrongPass#1'
    });
    const wsB = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Lambda B',
      ownerName: 'Owner B',
      email: 'b@lambda.com',
      password: 'StrongPass#1'
    });

    const response = await request(app.server)
      .get(`/api/v1/workspaces/${wsA.body.workspace.id}/members`)
      .set('Authorization', `Bearer ${wsB.body.accessToken}`);

    expect(response.status).toBe(403);
  });
});
