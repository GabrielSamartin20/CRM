import { ApiError } from '../types/kanban';

const API_BASE = '';

const getToken = (): string | null => {
  return localStorage.getItem('crm_access_token');
};

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  } & T;

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: payload.error?.code ?? 'HTTP_ERROR',
      message: payload.error?.message ?? `HTTP ${response.status}`
    });
  }

  return payload as T;
}
