import { AppError } from '../../lib/errors';
import { AuthService } from '../auth/auth.service';

export class WorkspacesService {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  current(workspaceId: string): Record<string, unknown> {
    const workspace = this.authService.getWorkspace(workspaceId);
    if (!workspace) throw new AppError({ statusCode: 404, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace não encontrado' });
    const members = this.authService.listWorkspaceUsers(workspaceId).map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      lastActiveAt: new Date().toISOString()
    }));
    return { ...workspace, plan: 'starter', members };
  }

  update(workspaceId: string, patch: { name?: string; logoUrl?: string; timezone?: string; currency?: string; language?: string }): Record<string, unknown> {
    return this.authService.updateWorkspace(workspaceId, patch) as unknown as Record<string, unknown>;
  }

  members(workspaceId: string): Array<Record<string, unknown>> {
    return this.authService.listWorkspaceUsers(workspaceId).map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      lastActiveAt: new Date().toISOString()
    }));
  }


  publicToken(workspaceId: string): { token: string; masked: string } {
    const token = this.authService.getWorkspacePublicToken(workspaceId);
    const masked = `wt_****${token.slice(-4)}`;
    return { token, masked };
  }

  rotatePublicToken(workspaceId: string): { token: string; masked: string } {
    const token = this.authService.rotateWorkspacePublicToken(workspaceId);
    return { token, masked: `wt_****${token.slice(-4)}` };
  }

  async removeMember(workspaceId: string, actorId: string, userId: string): Promise<void> {
    const members = this.authService.listWorkspaceUsers(workspaceId);
    const admins = members.filter((user) => user.role === 'ADMIN');
    if (actorId === userId && admins.length === 1) {
      throw new AppError({ statusCode: 400, code: 'LAST_ADMIN', message: 'Não é possível remover o único admin' });
    }

    this.authService.updateUser(userId, { deletedAt: new Date() });
    await this.authService.logoutAll(userId);
  }
}
