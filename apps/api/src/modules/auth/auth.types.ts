export type Role = 'ADMIN' | 'MANAGER' | 'AGENT';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: Role;
  workspaceId: string;
  jti: string;
}

export interface JwtRefreshPayload {
  sub: string;
  role: Role;
  workspaceId: string;
  jti: string;
  type: 'refresh';
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
  workspace: {
    id: string;
    slug: string;
    name: string;
  };
}
