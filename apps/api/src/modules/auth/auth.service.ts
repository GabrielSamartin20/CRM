import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AppError } from '../../lib/errors';
import { redis, RedisClientLike } from '../../lib/redis';
import { AuthResult, Role } from './auth.types';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

interface WorkspaceRecord {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  language: string;
}

interface UserRecord {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  avatarUrl: string | null;
  deletedAt: Date | null;
}

interface MailQueue {
  add(name: string, payload: Record<string, unknown>): Promise<void>;
}

class InMemoryMailerQueue implements MailQueue {
  async add(_name: string, _payload: Record<string, unknown>): Promise<void> {
    return;
  }
}

export const authStore = {
  workspaces: new Map<string, WorkspaceRecord>(),
  users: new Map<string, UserRecord>(),
  auditLogs: new Array<Record<string, unknown>>(),
  workspaceTokensById: new Map<string, string>(),
  workspacePublicTokens: new Map<string, string>()
};

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `workspace-${randomUUID()}`;

const refreshKey = (userId: string, tokenId: string): string => `refresh:${userId}:${tokenId}`;
const blacklistKey = (jti: string): string => `blacklist:${jti}`;

export class AuthService {
  constructor(
    private readonly deps: {
      passwordService: PasswordService;
      tokenService: TokenService;
      redisClient: RedisClientLike;
      mailerQueue: MailQueue;
    } = {
      passwordService: new PasswordService(),
      tokenService: new TokenService(),
      redisClient: redis,
      mailerQueue: new InMemoryMailerQueue()
    }
  ) {}

  private audit(payload: { action: string; userId?: string; workspaceId?: string; entity?: string; entityId?: string; changes?: unknown }): void {
    authStore.auditLogs.push({ ...payload, createdAt: new Date().toISOString() });
  }

  private buildAuthResult(user: UserRecord, workspace: WorkspaceRecord): AuthResult {
    return {
      accessToken: '',
      refreshToken: '',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      workspace: { id: workspace.id, slug: workspace.slug, name: workspace.name }
    };
  }

  private async issueTokens(input: { user: UserRecord; ip: string; userAgent: string }): Promise<{ accessToken: string; refreshToken: string }> {
    const access = this.deps.tokenService.createAccessToken({
      userId: input.user.id,
      email: input.user.email,
      role: input.user.role,
      workspaceId: input.user.workspaceId
    });

    const refresh = this.deps.tokenService.createRefreshToken({
      userId: input.user.id,
      role: input.user.role,
      workspaceId: input.user.workspaceId
    });

    await this.deps.redisClient.set(
      refreshKey(input.user.id, refresh.jti),
      JSON.stringify({ workspaceId: input.user.workspaceId, role: input.user.role, ip: input.ip, userAgent: input.userAgent }),
      'EX',
      60 * 60 * 24 * 7
    );

    return { accessToken: access.token, refreshToken: refresh.token };
  }

  async register(body: { workspaceName: string; ownerName: string; email: string; password: string }, ctx: { ip: string; userAgent: string }): Promise<AuthResult> {
    const exists = Array.from(authStore.users.values()).find((user) => user.email === body.email && user.deletedAt === null);
    if (exists) throw new AppError({ statusCode: 409, code: 'EMAIL_IN_USE', message: 'Email já cadastrado' });

    const workspace: WorkspaceRecord = {
      id: randomUUID(),
      slug: slugify(body.workspaceName),
      name: body.workspaceName,
      logoUrl: null,
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      language: 'pt-BR'
    };

    const user: UserRecord = {
      id: randomUUID(),
      workspaceId: workspace.id,
      email: body.email,
      name: body.ownerName,
      passwordHash: await this.deps.passwordService.hash(body.password),
      role: 'ADMIN',
      avatarUrl: null,
      deletedAt: null
    };

    const publicToken = `wt_${randomBytes(24).toString('hex')}`;
    authStore.workspaces.set(workspace.id, workspace);
    authStore.users.set(user.id, user);
    authStore.workspaceTokensById.set(workspace.id, publicToken);
    authStore.workspacePublicTokens.set(publicToken, workspace.id);

    const tokens = await this.issueTokens({ user, ip: ctx.ip, userAgent: ctx.userAgent });
    await this.deps.mailerQueue.add('welcome-email', { email: user.email, name: user.name, workspaceName: workspace.name });
    this.audit({ action: 'auth.register', userId: user.id, workspaceId: workspace.id, entity: 'user', entityId: user.id });

    return { ...this.buildAuthResult(user, workspace), ...tokens };
  }

  async login(body: { email: string; password: string; workspaceSlug?: string }, ctx: { ip: string; userAgent: string }): Promise<AuthResult | { workspaces: Array<{ id: string; slug: string; name: string }> }> {
    const candidates = Array.from(authStore.users.values()).filter((user) => user.email === body.email && user.deletedAt === null);
    if (candidates.length === 0) {
      this.audit({ action: 'auth.login.failed', entity: 'user', changes: { email: body.email } });
      throw new AppError({ statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' });
    }

    const validUsers: UserRecord[] = [];
    for (const candidate of candidates) {
      if (await this.deps.passwordService.verify(candidate.passwordHash, body.password)) validUsers.push(candidate);
    }

    if (validUsers.length === 0) {
      this.audit({ action: 'auth.login.failed', entity: 'user', changes: { email: body.email } });
      throw new AppError({ statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' });
    }

    let user: UserRecord;
    if (body.workspaceSlug) {
      const selected = validUsers.find((candidate) => authStore.workspaces.get(candidate.workspaceId)?.slug === body.workspaceSlug);
      if (!selected) throw new AppError({ statusCode: 403, code: 'WORKSPACE_FORBIDDEN', message: 'Usuário sem acesso ao workspace' });
      user = selected;
    } else if (validUsers.length === 1) {
      user = validUsers[0];
    } else {
      return {
        workspaces: validUsers
          .map((candidate) => authStore.workspaces.get(candidate.workspaceId))
          .filter((workspace): workspace is WorkspaceRecord => Boolean(workspace))
          .map((workspace) => ({ id: workspace.id, slug: workspace.slug, name: workspace.name }))
      };
    }

    const workspace = authStore.workspaces.get(user.workspaceId);
    if (!workspace) throw new AppError({ statusCode: 404, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace não encontrado' });

    const tokens = await this.issueTokens({ user, ip: ctx.ip, userAgent: ctx.userAgent });
    this.audit({ action: 'auth.login.success', userId: user.id, workspaceId: user.workspaceId, entity: 'user', entityId: user.id });
    return { ...this.buildAuthResult(user, workspace), ...tokens };
  }

  async refresh(refreshToken: string, ctx: { ip: string; userAgent: string }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.deps.tokenService.verifyRefreshToken(refreshToken);
    const key = refreshKey(payload.sub, payload.jti);
    const session = await this.deps.redisClient.get(key);
    if (!session) throw new AppError({ statusCode: 401, code: 'REFRESH_REVOKED', message: 'Refresh token inválido ou revogado' });

    await this.deps.redisClient.del(key);
    const user = authStore.users.get(payload.sub);
    if (!user || user.deletedAt) throw new AppError({ statusCode: 401, code: 'UNAUTHORIZED', message: 'Usuário inválido' });
    return this.issueTokens({ user, ip: ctx.ip, userAgent: ctx.userAgent });
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = this.deps.tokenService.verifyRefreshToken(refreshToken);
    await this.deps.redisClient.del(refreshKey(payload.sub, payload.jti));
  }

  async logoutAll(userId: string): Promise<void> {
    const keys = await this.deps.redisClient.keys(`refresh:${userId}:`);
    if (keys.length > 0) await this.deps.redisClient.del(...keys);
  }

  async blacklistAccessToken(jti: string): Promise<void> {
    await this.deps.redisClient.set(blacklistKey(jti), '1', 'EX', 60 * 15);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    return (await this.deps.redisClient.get(blacklistKey(jti))) !== null;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = Array.from(authStore.users.values()).find((candidate) => candidate.email === email && candidate.deletedAt === null);
    if (!user) return;
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');
    await this.deps.redisClient.set(`reset:${hash}`, JSON.stringify({ userId: user.id }), 'EX', 3600);
    await this.deps.mailerQueue.add('reset-password', { email, token });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hash = createHash('sha256').update(token).digest('hex');
    const key = `reset:${hash}`;
    const data = await this.deps.redisClient.get(key);
    if (!data) throw new AppError({ statusCode: 401, code: 'INVALID_RESET_TOKEN', message: 'Token inválido ou expirado' });

    const parsed = JSON.parse(data) as { userId: string };
    const user = authStore.users.get(parsed.userId);
    if (!user) throw new AppError({ statusCode: 404, code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' });

    user.passwordHash = await this.deps.passwordService.hash(newPassword);
    authStore.users.set(user.id, user);
    await this.logoutAll(user.id);
    await this.deps.redisClient.del(key);
  }

  getUserById(userId: string): UserRecord | null {
    return authStore.users.get(userId) ?? null;
  }

  listWorkspaceUsers(workspaceId: string): UserRecord[] {
    return Array.from(authStore.users.values()).filter((user) => user.workspaceId === workspaceId && user.deletedAt === null);
  }

  getWorkspace(workspaceId: string): WorkspaceRecord | null {
    return authStore.workspaces.get(workspaceId) ?? null;
  }

  updateWorkspace(workspaceId: string, patch: Partial<Pick<WorkspaceRecord, 'name' | 'logoUrl' | 'timezone' | 'currency' | 'language'>>): WorkspaceRecord {
    const workspace = authStore.workspaces.get(workspaceId);
    if (!workspace) throw new AppError({ statusCode: 404, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace não encontrado' });
    const updated = { ...workspace, ...patch };
    authStore.workspaces.set(workspaceId, updated);
    return updated;
  }

  updateUser(userId: string, patch: Partial<Pick<UserRecord, 'name' | 'avatarUrl' | 'role' | 'passwordHash' | 'deletedAt'>>): UserRecord {
    const user = authStore.users.get(userId);
    if (!user) throw new AppError({ statusCode: 404, code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' });
    const updated = { ...user, ...patch };
    authStore.users.set(userId, updated);
    return updated;
  }

  async createInvitedUser(input: { workspaceId: string; email: string; name: string; role: Role; password: string }): Promise<UserRecord> {
    const user: UserRecord = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash: await this.deps.passwordService.hash(input.password),
      avatarUrl: null,
      deletedAt: null
    };
    authStore.users.set(user.id, user);
    return user;
  }

  getWorkspacePublicToken(workspaceId: string): string {
    const token = authStore.workspaceTokensById.get(workspaceId);
    if (!token) throw new AppError({ statusCode: 404, code: 'PUBLIC_TOKEN_NOT_FOUND', message: 'Token público não encontrado' });
    return token;
  }

  rotateWorkspacePublicToken(workspaceId: string): string {
    const oldToken = authStore.workspaceTokensById.get(workspaceId);
    if (oldToken) authStore.workspacePublicTokens.delete(oldToken);
    const token = `wt_${randomBytes(24).toString('hex')}`;
    authStore.workspaceTokensById.set(workspaceId, token);
    authStore.workspacePublicTokens.set(token, workspaceId);
    return token;
  }
}
