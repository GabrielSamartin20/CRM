import { randomBytes } from 'node:crypto';
import { AppError } from '../../lib/errors';
import { redis } from '../../lib/redis';
import { AuthService } from '../auth/auth.service';
import { PasswordService } from '../auth/password.service';

export class UsersService {
  constructor(private readonly authService: AuthService = new AuthService(), private readonly passwordService: PasswordService = new PasswordService()) {}

  getMe(userId: string): Record<string, unknown> {
    const user = this.authService.getUserById(userId);
    if (!user) throw new AppError({ statusCode: 404, code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' });
    const workspace = this.authService.getWorkspace(user.workspaceId);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl
      },
      workspace,
      permissions: user.role === 'ADMIN' ? ['*'] : user.role === 'MANAGER' ? ['users:read', 'conversations:write'] : ['conversations:write']
    };
  }

  updateMe(userId: string, body: { name?: string; avatarUrl?: string }): Record<string, unknown> {
    const updated = this.authService.updateUser(userId, { name: body.name, avatarUrl: body.avatarUrl });
    return { id: updated.id, name: updated.name, avatarUrl: updated.avatarUrl };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = this.authService.getUserById(userId);
    if (!user) throw new AppError({ statusCode: 404, code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' });
    const ok = await this.passwordService.verify(user.passwordHash, currentPassword);
    if (!ok) throw new AppError({ statusCode: 401, code: 'INVALID_PASSWORD', message: 'Senha atual inválida' });

    const hash = await this.passwordService.hash(newPassword);
    this.authService.updateUser(userId, { passwordHash: hash });
    await this.authService.logoutAll(userId);
  }

  list(workspaceId: string, page: number, limit: number): { items: Array<Record<string, unknown>>; total: number } {
    const all = this.authService.listWorkspaceUsers(workspaceId);
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);
    return {
      items: paged.map((user) => ({ id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl })),
      total: all.length
    };
  }

  async invite(workspaceId: string, body: { email: string; role: 'ADMIN' | 'MANAGER' | 'AGENT'; name?: string }): Promise<{ token: string }> {
    const token = randomBytes(32).toString('hex');
    await redis.set(`invite:${token}`, JSON.stringify({ workspaceId, email: body.email, role: body.role, name: body.name ?? '' }), 'EX', 48 * 60 * 60);
    return { token };
  }

  async acceptInvite(body: { token: string; password: string; name: string }): Promise<Record<string, unknown>> {
    const key = `invite:${body.token}`;
    const invite = await redis.get(key);
    if (!invite) throw new AppError({ statusCode: 401, code: 'INVALID_INVITE', message: 'Convite inválido' });

    const parsed = JSON.parse(invite) as { workspaceId: string; email: string; role: 'ADMIN' | 'MANAGER' | 'AGENT' };
    const user = await this.authService.createInvitedUser({
      workspaceId: parsed.workspaceId,
      email: parsed.email,
      role: parsed.role,
      name: body.name,
      password: body.password
    });

    await redis.del(key);

    const workspace = this.authService.getWorkspace(parsed.workspaceId);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      workspace
    };
  }

  updateRole(actorId: string, targetId: string, role: 'ADMIN' | 'MANAGER' | 'AGENT'): Record<string, unknown> {
    if (actorId === targetId) {
      throw new AppError({ statusCode: 400, code: 'SELF_ROLE_CHANGE_FORBIDDEN', message: 'Não é permitido rebaixar o próprio role' });
    }
    const updated = this.authService.updateUser(targetId, { role });
    return { id: updated.id, role: updated.role };
  }

  async softDelete(targetId: string): Promise<void> {
    this.authService.updateUser(targetId, { deletedAt: new Date() });
    await this.authService.logoutAll(targetId);
  }
}
