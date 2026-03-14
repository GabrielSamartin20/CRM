# Auth Flow (JWT + Refresh Rotation)

```text
[POST /auth/login]
      |
      | valida credenciais
      v
  emite access(15m) + refresh(7d, jti=R1)
      |
      | salva refresh:{userId}:R1 no Redis
      v
 Cliente usa access token em rotas protegidas
      |
      | access expirou
      v
[POST /auth/refresh] com R1
      |
      | verifica assinatura + sessão no Redis
      | deleta refresh:{userId}:R1
      v
  emite novo access + refresh(jti=R2)
      |
      | salva refresh:{userId}:R2
      v
  R1 fica revogado (rotation)
      |
      | logout
      v
[POST /auth/logout]
      |
      | deleta refresh atual + blacklist do access jti
      v
 sessão encerrada no dispositivo

[POST /auth/logout-all]
      |
      | deleta refresh:{userId}:*
      v
 todos os dispositivos encerrados
```
