import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../lib/errors';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const now = (): number => Date.now();

const getKey = (request: FastifyRequest, namespace: string): string => {
  const ip = request.ip ?? 'unknown';
  const userId = request.user?.id ?? 'anonymous';
  return `${namespace}:${ip}:${userId}`;
};

export const createRateLimit = (options: { max: number; windowMs: number; namespace: string }) => {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const key = getKey(request, options.namespace);
    const current = buckets.get(key);
    const timestamp = now();

    if (!current || current.resetAt < timestamp) {
      buckets.set(key, { count: 1, resetAt: timestamp + options.windowMs });
      return;
    }

    if (current.count >= options.max) {
      throw new AppError({ statusCode: 429, code: 'RATE_LIMITED', message: 'Muitas tentativas, tente novamente mais tarde' });
    }

    current.count += 1;
    buckets.set(key, current);
  };
};

export const globalRateLimit = createRateLimit({ max: 200, windowMs: 60_000, namespace: 'global' });
export const authRateLimit = createRateLimit({ max: 10, windowMs: 15 * 60_000, namespace: 'auth' });
