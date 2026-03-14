import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../lib/errors';
import { Role } from '../modules/auth/auth.types';

export function authorize(...roles: Role[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user || !roles.includes(request.user.role)) {
      throw new AppError({
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Permissão insuficiente para esta ação'
      });
    }
  };
}
