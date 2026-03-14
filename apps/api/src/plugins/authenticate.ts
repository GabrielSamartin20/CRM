import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../lib/errors';
import { AuthService } from '../modules/auth/auth.service';
import { TokenService } from '../modules/auth/token.service';

const tokenService = new TokenService();
const authService = new AuthService();

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authorization = request.headers.authorization;
  if (!authorization || typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    throw new AppError({ statusCode: 401, code: 'UNAUTHORIZED', message: 'Token inválido ou ausente' });
  }

  const token = authorization.slice('Bearer '.length);
  let payload;
  try {
    payload = tokenService.verifyAccessToken(token);
  } catch (_error) {
    throw new AppError({ statusCode: 401, code: 'UNAUTHORIZED', message: 'Token inválido ou expirado' });
  }

  if (await authService.isBlacklisted(payload.jti)) {
    throw new AppError({ statusCode: 401, code: 'TOKEN_REVOKED', message: 'Token revogado' });
  }

  request.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    workspaceId: payload.workspaceId,
    jti: payload.jti
  };
}
