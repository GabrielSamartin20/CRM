# Kanban Usage

## Como criar o primeiro pipeline via API (curl)
```bash
# 1) Login/registro e obtenha ACCESS_TOKEN
# 2) Crie pipeline
curl -X POST http://localhost:3000/api/v1/pipelines \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Vendas","description":"Pipeline principal"}'
```

## Como configurar SLA por stage
Use update de stage e informe `slaHours`:
```bash
curl -X PUT http://localhost:3000/api/v1/pipelines/{pipelineId}/stages/{stageId} \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slaHours": 48}'
```

## Como filtrar deals por origem UTM no board
Use o endpoint com query `channel`:
```bash
curl "http://localhost:3000/api/v1/deals?channel=GOOGLE_ADS&page=1&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Atalhos de teclado para drag-and-drop
No frontend (Etapa B) o drag usará `KeyboardSensor` do `@dnd-kit`:
- `Tab`: navegar entre cards focáveis
- `Space/Enter`: iniciar drag do item focado
- `Setas`: mover foco/drop target
- `Space/Enter`: soltar no alvo
- `Esc`: cancelar drag
