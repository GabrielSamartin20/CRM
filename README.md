# CRM Monorepo

## Primeiro acesso
Após subir o stack, crie o primeiro workspace e usuário admin:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceName": "Minha Empresa",
    "ownerName": "Admin Inicial",
    "email": "admin@empresa.com",
    "password": "StrongPass#1"
  }'
```

Faça login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "StrongPass#1"
  }'
```
