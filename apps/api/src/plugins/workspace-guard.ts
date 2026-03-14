import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../lib/errors';

export async function workspaceGuard(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params = request.params as any;
  const paramWorkspaceId = params?.workspaceId as string | undefined;
  if (paramWorkspaceId && request.user && paramWorkspaceId !== request.user.workspaceId) {
    throw new AppError({
      statusCode: 403,
      code: 'WORKSPACE_MISMATCH',
      message: 'Acesso negado a este workspace'
    });
  }
}
