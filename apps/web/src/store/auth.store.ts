import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  workspaceId: string | null;
  setSession(input: { accessToken: string; workspaceId: string }): void;
  clear(): void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      workspaceId: null,
      setSession(input) {
        localStorage.setItem('crm_access_token', input.accessToken);
        set({ accessToken: input.accessToken, workspaceId: input.workspaceId });
      },
      clear() {
        localStorage.removeItem('crm_access_token');
        set({ accessToken: null, workspaceId: null });
      }
    }),
    { name: 'crm-auth' }
  )
);
