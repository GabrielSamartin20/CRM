import { FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../plugins/authenticate';
import { workspaceGuard } from '../plugins/workspace-guard';

export const authGuard = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await authenticate(request, reply);
};

export const workspaceGuardCompat = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await workspaceGuard(request, reply);
};
