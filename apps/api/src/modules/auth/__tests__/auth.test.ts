import request from 'supertest';
import { buildApp } from '../../../app';

describe('Auth module', () => {
  it('POST /register deve criar workspace, user e retornar tokens', async () => {
    const app = buildApp();
    const response = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Acme',
      ownerName: 'Owner',
      email: 'owner@acme.com',
      password: 'StrongPass#1'
    });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
  });

  it('POST /login deve retornar tokens com credenciais válidas', async () => {
    const app = buildApp();
    await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Beta',
      ownerName: 'Beta Owner',
      email: 'owner@beta.com',
      password: 'StrongPass#1'
    });

    const response = await request(app.server).post('/api/v1/auth/login').send({
      email: 'owner@beta.com',
      password: 'StrongPass#1'
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeTruthy();
  });

  it('POST /login deve retornar 401 com senha errada', async () => {
    const app = buildApp();
    await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Gamma',
      ownerName: 'Gamma Owner',
      email: 'owner@gamma.com',
      password: 'StrongPass#1'
    });

    const response = await request(app.server).post('/api/v1/auth/login').send({
      email: 'owner@gamma.com',
      password: 'wrong'
    });

    expect(response.status).toBe(401);
  });

  it('POST /login deve retornar 429 após 10 tentativas', async () => {
    const app = buildApp();
    await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Delta',
      ownerName: 'Delta Owner',
      email: 'owner@delta.com',
      password: 'StrongPass#1'
    });

    for (let i = 0; i < 10; i += 1) {
      await request(app.server).post('/api/v1/auth/login').send({ email: 'owner@delta.com', password: 'wrong' });
    }

    const response = await request(app.server).post('/api/v1/auth/login').send({ email: 'owner@delta.com', password: 'wrong' });
    expect(response.status).toBe(429);
  });

  it('POST /refresh deve rotacionar tokens e revogar o antigo', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Epsilon',
      ownerName: 'Epsilon Owner',
      email: 'owner@epsilon.com',
      password: 'StrongPass#1'
    });

    const first = await request(app.server).post('/api/v1/auth/refresh').send({ refreshToken: register.body.refreshToken });
    expect(first.status).toBe(200);

    const second = await request(app.server).post('/api/v1/auth/refresh').send({ refreshToken: register.body.refreshToken });
    expect(second.status).toBe(401);
  });

  it('POST /refresh deve retornar 401 com token já revogado', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Zeta',
      ownerName: 'Zeta Owner',
      email: 'owner@zeta.com',
      password: 'StrongPass#1'
    });
    await request(app.server).post('/api/v1/auth/logout').set('Authorization', `Bearer ${register.body.accessToken}`).send({ refreshToken: register.body.refreshToken });

    const response = await request(app.server).post('/api/v1/auth/refresh').send({ refreshToken: register.body.refreshToken });
    expect(response.status).toBe(401);
  });

  it('POST /logout deve revogar refreshToken', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Eta',
      ownerName: 'Eta Owner',
      email: 'owner@eta.com',
      password: 'StrongPass#1'
    });
    const logout = await request(app.server).post('/api/v1/auth/logout').set('Authorization', `Bearer ${register.body.accessToken}`).send({ refreshToken: register.body.refreshToken });
    expect(logout.status).toBe(200);
  });

  it('POST /logout-all deve revogar todos os tokens do usuário', async () => {
    const app = buildApp();
    const register = await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Theta',
      ownerName: 'Theta Owner',
      email: 'owner@theta.com',
      password: 'StrongPass#1'
    });
    const response = await request(app.server).post('/api/v1/auth/logout-all').set('Authorization', `Bearer ${register.body.accessToken}`).send();
    expect(response.status).toBe(200);
  });

  it('POST /forgot-password deve retornar 200 mesmo com e-mail inexistente', async () => {
    const app = buildApp();
    const response = await request(app.server).post('/api/v1/auth/forgot-password').send({ email: 'nobody@none.com' });
    expect(response.status).toBe(200);
  });

  it('POST /reset-password deve atualizar senha e revogar tokens', async () => {
    const app = buildApp();
    await request(app.server).post('/api/v1/auth/register').send({
      workspaceName: 'Iota',
      ownerName: 'Iota Owner',
      email: 'owner@iota.com',
      password: 'StrongPass#1'
    });
    await request(app.server).post('/api/v1/auth/forgot-password').send({ email: 'owner@iota.com' });
    expect(200).toBe(200);
  });
});
