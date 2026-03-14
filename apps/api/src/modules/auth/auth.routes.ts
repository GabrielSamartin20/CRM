import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuthController } from './auth.controller';

export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const controller = new AuthController();

  app.post('/api/v1/auth/register', (request, reply) => controller.register(request, reply));
  app.post('/api/v1/auth/login', (request, reply) => controller.login(request, reply));
  app.post('/api/v1/auth/refresh', (request, reply) => controller.refresh(request, reply));
  app.post('/api/v1/auth/logout', (request, reply) => controller.logout(request, reply));
  app.post('/api/v1/auth/logout-all', (request, reply) => controller.logoutAll(request, reply));
  app.post('/api/v1/auth/forgot-password', (request, reply) => controller.forgotPassword(request, reply));
  app.post('/api/v1/auth/reset-password', (request, reply) => controller.resetPassword(request, reply));
};
