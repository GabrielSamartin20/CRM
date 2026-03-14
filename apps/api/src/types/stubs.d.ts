declare module 'dotenv' {
  const dotenv: { config: () => void };
  export default dotenv;
}

declare module 'zod' {
  type ZodType = {
    parse: (input: unknown) => unknown;
    optional: () => ZodType;
    default: (value: unknown) => ZodType;
    min: (v: number) => ZodType;
    max: (v: number) => ZodType;
    int: () => ZodType;
    positive: () => ZodType;
    nonnegative: () => ZodType;
    url: () => ZodType;
    email: () => ZodType;
  };
  export const z: {
    object: (shape: Record<string, ZodType>) => ZodType;
    string: () => ZodType;
    number: () => ZodType;
    enum: (values: string[]) => ZodType;
    record: (_value: ZodType) => ZodType;
    array: (value: ZodType) => ZodType;
    unknown: () => ZodType;
    coerce: { number: () => ZodType };
  };
}

declare module 'fastify' {
  export interface FastifyRequest {
    id: string;
    ip?: string;
    body?: unknown;
    query?: unknown;
    params?: unknown;
    headers: Record<string, string | string[] | undefined>;
    rawBody?: string;
    user?: {
      id: string;
      email: string;
      role: 'ADMIN' | 'MANAGER' | 'AGENT';
      workspaceId: string;
      jti: string;
    };
  }
  export interface FastifyReply {
    code: (statusCode: number) => FastifyReply;
    send: (payload: unknown) => void;
    type: (contentType: string) => FastifyReply;
  }
  type Hook = (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void;
  type Handler = (request: FastifyRequest, reply: FastifyReply) => Promise<unknown> | unknown;
  export interface FastifyInstance {
    server: unknown;
    register: (plugin: FastifyPluginAsync) => void;
    get: (path: string, optsOrHandler: { preHandler?: Hook[] } | Handler, maybeHandler?: Handler) => void;
    post: (path: string, optsOrHandler: { preHandler?: Hook[] } | Handler, maybeHandler?: Handler) => void;
    patch: (path: string, optsOrHandler: { preHandler?: Hook[] } | Handler, maybeHandler?: Handler) => void;
    delete: (path: string, optsOrHandler: { preHandler?: Hook[] } | Handler, maybeHandler?: Handler) => void;
    addHook: (name: string, hook: Hook) => void;
    addContentTypeParser: (
      contentType: string,
      options: { parseAs: string },
      parser: (request: FastifyRequest, body: string, done: (error: Error | null, body?: unknown) => void) => void
    ) => void;
    setErrorHandler: (handler: (error: Error, request: FastifyRequest, reply: FastifyReply) => void) => void;
    listen: (input: { host: string; port: number }) => Promise<void>;
  }
  export type FastifyPluginAsync = (app: FastifyInstance) => Promise<void>;
  export default function Fastify(options?: { logger?: boolean }): FastifyInstance;
}

declare module 'socket.io' {
  export interface Socket {
    handshake: { query: Record<string, unknown>; headers: Record<string, string | undefined> };
    data: Record<string, unknown>;
    join: (room: string) => void;
    on: (event: string, cb: (payload: Record<string, unknown>) => void) => void;
    to: (room: string) => { emit: (event: string, payload: unknown) => void };
  }
  export class Server {
    constructor(server: unknown, options?: unknown);
    of(name: string): {
      use: (cb: (socket: Socket, next: (error?: Error) => void) => void) => void;
      on: (event: string, cb: (socket: Socket) => void) => void;
      to: (room: string) => { emit: (event: string, payload: unknown) => void };
    };
  }
}

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: unknown;
  }
  const jwt: {
    sign: (payload: unknown, secret: string, options?: { expiresIn?: string }) => string;
    verify: (token: string, secret: string) => unknown;
  };
  export default jwt;
}

declare module 'argon2' {
  const argon2: {
    argon2id: number;
    hash: (value: string, options?: unknown) => Promise<string>;
    verify: (hash: string, value: string) => Promise<boolean>;
  };
  export default argon2;
}

declare module 'bullmq' {
  export class Queue<T> {
    constructor(name: string, options?: unknown);
    add: (name: string, data: T, options?: unknown) => Promise<void>;
  }
  export interface Job<T = unknown> {
    data: T;
  }
  export class Worker<T> {
    constructor(name: string, processor: (job: Job<T>) => Promise<void>, options?: unknown);
  }
}

declare module 'ioredis' {
  export default class IORedis {
    constructor(url: string, options?: unknown);
  }
}

declare module 'supertest' {
  interface SupertestResponse {
    status: number;
    text: string;
    body: Record<string, unknown>;
  }
  interface SupertestRequest {
    query: (q: Record<string, unknown>) => Promise<SupertestResponse>;
    set: (k: string, v: string) => SupertestRequest;
    send: (body?: unknown) => Promise<SupertestResponse>;
  }
  export default function request(server: unknown): {
    get: (path: string) => SupertestRequest;
    post: (path: string) => SupertestRequest;
    patch: (path: string) => SupertestRequest;
    delete: (path: string) => SupertestRequest;
  };
}

declare module 'node:crypto' {
  export const createHmac: (algo: string, secret: string) => { update: (body: string) => { digest: (encoding: 'hex') => string } };
  export const timingSafeEqual: (a: { length: number }, b: { length: number }) => boolean;
  export const randomUUID: () => string;
  export const randomBytes: (size: number) => { toString: (encoding: 'hex') => string };
  export const createHash: (algo: string) => { update: (v: string) => { digest: (encoding: 'hex') => string } };
}

declare module 'node:http' {
  export const createServer: (server?: unknown) => unknown;
}

declare var process: {
  env: Record<string, string | undefined>;
  stdout: { write: (message: string) => void };
  stderr: { write: (message: string) => void };
  exit: (code: number) => never;
};

declare var Buffer: { from: (input: string) => { length: number } };
declare function setTimeout(fn: () => void, ms: number): number;
declare function clearTimeout(id: number): void;
declare function fetch(input: string, init?: unknown): Promise<{ ok: boolean; status: number; headers: { get: (name: string) => string | null }; json: () => Promise<unknown> }>;
declare class AbortController { signal: unknown; abort(): void; }

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: (value: unknown) => { toBe: (expected: unknown) => void; toBeTruthy: () => void; toHaveLength: (expected: number) => void; toHaveBeenCalledTimes: (expected: number) => void };
declare const beforeEach: (fn: () => void) => void;
declare const jest: {
  fn: () => ((...args: unknown[]) => unknown) & { mockReset: () => { mockResolvedValue: (value: unknown) => void } };
  mock: (path: string, factory: () => unknown) => void;
};
