import { FastifyReply, FastifyRequest } from 'fastify';
import { authRateLimit } from '../../plugins/rate-limit';
import { authenticate } from '../../plugins/authenticate';
import { AppError } from '../../lib/errors';
import { AuthService } from './auth.service';
import { forgotPasswordSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema } from './auth.schema';

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  private requestContext(request: FastifyRequest): { ip: string; userAgent: string } {
    return {
      ip: request.ip ?? 'unknown',
      userAgent: String(request.headers['user-agent'] ?? 'unknown')
    };
  }

  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = registerSchema.parse(request.body) as { workspaceName: string; ownerName: string; email: string; password: string };
    const result = await this.authService.register(body, this.requestContext(request));
    reply.code(201).send(result);
  }

  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await authRateLimit(request, reply);
    const body = loginSchema.parse(request.body) as { email: string; password: string; workspaceSlug?: string };
    const result = await this.authService.login(body, this.requestContext(request));

    if ('workspaces' in result) {
      reply.code(300).send(result);
      return;
    }

    reply.code(200).send(result);
  }

  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = refreshSchema.parse(request.body) as { refreshToken: string };
    const tokens = await this.authService.refresh(body.refreshToken, this.requestContext(request));
    reply.code(200).send(tokens);
  }

  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await authenticate(request, reply);
    const body = refreshSchema.parse(request.body) as { refreshToken: string };
    await this.authService.logout(body.refreshToken);
    if (request.user?.jti) {
      await this.authService.blacklistAccessToken(request.user.jti);
    }
    reply.code(200).send({ ok: true });
  }

  async logoutAll(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await authenticate(request, reply);
    if (!request.user) {
      throw new AppError({ statusCode: 401, code: 'UNAUTHORIZED', message: 'Usuário não autenticado' });
    }
    await this.authService.logoutAll(request.user.id);
    reply.code(200).send({ ok: true });
  }

  async forgotPassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = forgotPasswordSchema.parse(request.body) as { email: string };
    await this.authService.forgotPassword(body.email);
    reply.code(200).send({ ok: true });
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = resetPasswordSchema.parse(request.body) as { token: string; newPassword: string };
    await this.authService.resetPassword(body.token, body.newPassword);
    reply.code(200).send({ ok: true });
  }
}
