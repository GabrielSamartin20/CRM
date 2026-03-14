const SESSION_KEY = 'crm_tracker_session';

const toBase64 = (value: string): string => {
  if (typeof btoa === 'function') return btoa(value);
  return value;
};

export const getSessionId = (): string => {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const generated = toBase64(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  sessionStorage.setItem(SESSION_KEY, generated);
  return generated;
};
