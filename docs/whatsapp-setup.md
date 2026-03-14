# WhatsApp Business Cloud API — Setup

## 1) Criar o App na Meta for Developers
1. Acesse https://developers.facebook.com/ e crie um app do tipo **Business**.
2. No dashboard do app, adicione o produto **WhatsApp**.
3. Anote os IDs: **App ID**, **WABA ID** e **Phone Number ID**.
4. No `.env`, preencha:
   - `WHATSAPP_APP_ID`
   - `WHATSAPP_WABA_ID`
   - `WHATSAPP_PHONE_NUMBER_ID`

## 2) Configurar o webhook (URL + verify token)
1. Defina no `.env`:
   - `WHATSAPP_VERIFY_TOKEN` (string segura definida por você)
   - `WHATSAPP_APP_SECRET`
2. Exponha sua API publicamente (ngrok/cloudflared).
3. Na Meta, configure webhook para:
   - URL: `https://SEU-DOMINIO/api/v1/webhooks/whatsapp`
   - Verify Token: valor de `WHATSAPP_VERIFY_TOKEN`
4. Assine os campos `messages` e `message_template_status_update`.

## 3) Obter token permanente via System User
1. No **Business Manager**: Configurações do negócio → Usuários do sistema.
2. Crie um **System User** com permissão de Admin.
3. Vincule o app ao System User e gere token com escopos do WhatsApp.
4. Salve em `WHATSAPP_TOKEN`.
5. Renove de forma automatizada no cofre de segredos da sua infra.

## 4) Testar localmente com ngrok ou cloudflared
### ngrok
```bash
ngrok http 3000
```
Use a URL HTTPS gerada no webhook da Meta.

### cloudflared
```bash
cloudflared tunnel --url http://localhost:3000
```
Use a URL HTTPS pública informada.

## 5) Enviar template de teste via curl
```bash
curl -X POST "https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${WHATSAPP_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": { "code": "en_US" }
    }
  }'
```

## Checklist rápido
- [ ] Webhook `GET /api/v1/webhooks/whatsapp` validando `hub.verify_token`
- [ ] Webhook `POST /api/v1/webhooks/whatsapp` validando `X-Hub-Signature-256`
- [ ] `WHATSAPP_TOKEN` permanente configurado
- [ ] Eventos de entrada sendo enfileirados na BullMQ
