import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../lib/env';
import { JwtAccessPayload, JwtRefreshPayload, Role } from './auth.types';

export class TokenService {
  createAccessToken(input: { userId: string; email: string; role: Role; workspaceId: string }): { token: string; jti: string } {
    const jti = randomUUID();
    const payload: JwtAccessPayload = {
      sub: input.userId,
      email: input.email,
      role: input.role,
      workspaceId: input.workspaceId,
      jti
    };
    return {
      token: jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN }),
      jti
    };
  }

  createRefreshToken(input: { userId: string; role: Role; workspaceId: string }): { token: string; jti: string } {
    const jti = randomUUID();
    const payload: JwtRefreshPayload = {
      sub: input.userId,
      role: input.role,
      workspaceId: input.workspaceId,
      jti,
      type: 'refresh'
    };

    return {
      token: jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN }),
      jti
    };
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
  }

  verifyRefreshToken(token: string): JwtRefreshPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
  }
}
