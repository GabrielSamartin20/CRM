import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export interface AppErrorOptions {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
  }
}

const mapKnownError = (error: unknown): AppError | null => {
  const maybe = error as { code?: string; issues?: unknown };
  if (maybe.issues) {
    return new AppError({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Dados inválidos', details: maybe.issues });
  }
  if (maybe.code === 'P2002') return new AppError({ statusCode: 409, code: 'CONFLICT', message: 'Registro duplicado' });
  if (maybe.code === 'P2025') return new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Registro não encontrado' });
  if (maybe.code === 'P2003') return new AppError({ statusCode: 422, code: 'UNPROCESSABLE_ENTITY', message: 'Violação de relacionamento' });
  return null;
};

export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    const mapped = error instanceof AppError ? error : mapKnownError(error);
    const appError = mapped ?? new AppError({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });

    reply.code(appError.statusCode).send({
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details ?? null,
        requestId: request.id
      }
    });
  });
};
