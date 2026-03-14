# Tracker Integration Guide

## 1) Instalar snippet em landing page HTML
```html
<script src="https://cdn.seu-dominio.com/crm-tracker.umd.js"></script>
<script>
  window.CRMTracker.init({
    workspaceToken: 'wt_xxxxxxxxxxxxxxxxxxxxxxxx',
    apiUrl: 'https://api.seu-crm.com'
  });
</script>
```

## 2) Integrar com React (useEffect no _app.tsx)
```tsx
useEffect(() => {
  window.CRMTracker?.init({
    workspaceToken: process.env.NEXT_PUBLIC_WORKSPACE_TOKEN!,
    apiUrl: process.env.NEXT_PUBLIC_API_URL!
  });
}, []);
```

## 3) Configurar token público no painel
1. Faça login como ADMIN.
2. Chame `GET /api/v1/workspaces/current/public-token` para ver o token atual.
3. Se necessário, rode `POST /api/v1/workspaces/current/public-token/rotate` para girar token.
4. Atualize o token no snippet da landing page.

## 4) Exemplo completo de formulário com identify()
```html
<form id="lead-form">
  <input name="name" placeholder="Nome" />
  <input name="email" placeholder="Email" />
  <input name="phone" placeholder="Telefone" />
  <button type="submit">Enviar</button>
</form>
<script>
  const form = document.getElementById('lead-form');
  form.addEventListener('submit', function () {
    const formData = new FormData(form);
    window.CRMTracker.identify({
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || '')
    });
  });
</script>
```

## 5) Testar localmente com curl simulando UTM params
```bash
curl -X POST http://localhost:3000/api/v1/attribution \
  -H "Content-Type: application/json" \
  -H "X-Workspace-Token: wt_xxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "phone": "+5511999999999",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "brand-search",
    "gclid": "test-gclid-123",
    "landingPage": "https://landing.exemplo.com/?utm_source=google&utm_medium=cpc"
  }'
```
