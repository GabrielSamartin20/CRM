import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketStore {
  socket: Socket | null;
  connected: boolean;
  connect(token: string, workspaceId: string): void;
  disconnect(): void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connected: false,
  connect(token: string, workspaceId: string) {
    if (get().socket) return;

    const socket = io('/crm', {
      path: '/socket.io',
      transports: ['websocket'],
      query: { token, workspaceId }
    });

    socket.on('connect', () => {
      set({ connected: true });
      socket.emit('workspace:join', { room: `workspace:${workspaceId}` });
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });

    set({ socket });
  },
  disconnect() {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
    }
    set({ socket: null, connected: false });
  }
}));
