import { createServer } from 'node:http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { env } from '../lib/env';

interface AuthClaims extends JwtPayload {
  sub: string;
  workspaceId: string;
}

export interface SocketGateway {
  io: Server;
  emitToWorkspace(event: string, workspaceId: string, payload: Record<string, unknown>): void;
}

const getToken = (socket: Socket): string | null => {
  const queryToken = socket.handshake.query.token;
  if (typeof queryToken === 'string') {
    return queryToken;
  }

  const authHeader = socket.handshake.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  return null;
};

export const createSocketGateway = (httpServer: ReturnType<typeof createServer>): SocketGateway => {
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: '*' }
  });

  const namespace = io.of('/crm');

  namespace.use((socket, next) => {
    const token = getToken(socket);
    if (!token) {
      return next(new Error('Unauthorized'));
    }

    try {
      const claims = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthClaims;
      socket.data.userId = claims.sub;
      socket.data.workspaceId = claims.workspaceId;
      return next();
    } catch (_error) {
      return next(new Error('Unauthorized'));
    }
  });

  namespace.on('connection', (socket) => {
    const workspaceId = socket.data.workspaceId as string;
    socket.join(`workspace:${workspaceId}`);

    socket.on('conversation:typing', (payload: Record<string, unknown>) => {
      socket.to(`workspace:${workspaceId}`).emit('conversation:typing', payload);
    });
  });

  return {
    io,
    emitToWorkspace(event: string, workspaceId: string, payload: Record<string, unknown>) {
      namespace.to(`workspace:${workspaceId}`).emit(event, payload);
    }
  };
};
