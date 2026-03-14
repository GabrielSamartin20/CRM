import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useSocketStore } from '../store/socket.store';

export function useSocket() {
  const token = useAuthStore((state) => state.accessToken);
  const workspaceId = useAuthStore((state) => state.workspaceId);
  const socket = useSocketStore((state) => state.socket);
  const connected = useSocketStore((state) => state.connected);
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);

  useEffect(() => {
    if (token && workspaceId) {
      connect(token, workspaceId);
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, token, workspaceId]);

  return { socket, connected };
}
