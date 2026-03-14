export interface RedisClientLike {
  set(key: string, value: string, mode?: 'EX', ttlSeconds?: number): Promise<'OK'>;
  get(key: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
}

export class InMemoryRedis implements RedisClientLike {
  private readonly values = new Map<string, { value: string; expiresAt: number | null }>();

  private isExpired(key: string): boolean {
    const entry = this.values.get(key);
    if (!entry) return true;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.values.delete(key);
      return true;
    }
    return false;
  }

  async set(key: string, value: string, mode?: 'EX', ttlSeconds?: number): Promise<'OK'> {
    const expiresAt = mode === 'EX' && ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.values.set(key, { value, expiresAt });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    if (this.isExpired(key)) return null;
    return this.values.get(key)?.value ?? null;
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.values.delete(key)) count += 1;
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const prefix = pattern.replace('*', '');
    const keys = Array.from(this.values.keys()).filter((key) => key.startsWith(prefix));
    return keys.filter((key) => !this.isExpired(key));
  }
}

export const redis = new InMemoryRedis();
