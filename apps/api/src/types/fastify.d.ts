import 'fastify';
import { Role } from '../modules/auth/auth.types';

declare module 'fastify' {
  interface FastifyRequest {
    id: string;
    ip?: string;
    rawBody?: string;
    user?: {
      id: string;
      email: string;
      role: Role;
      workspaceId: string;
      jti: string;
    };
  }

  interface FastifyInstance {
    put: FastifyInstance['patch'];
  }
}
