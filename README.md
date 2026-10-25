# Receptor de Postbacks — Desafio TWR

API em TypeScript (Fastify + Zod + Prisma/PostgreSQL) que recebe webhooks de venda por `POST` e devolve um relatório por `GET`.

**URL pública:** `https://SEU-APP.onrender.com`

## Estrutura

```
src/
  app.ts / server.ts
  config/env.ts              # variáveis de ambiente validadas com Zod
  lib/prisma.ts
  modules/
    postbacks/  routes → controller → service  (+ schema Zod)
    reports/    routes → controller → service  (+ schema Zod)
prisma/schema.prisma
```

- **routes**: define o endpoint e hooks (ex.: autenticação).
- **controller**: valida a entrada com Zod e traduz o resultado em HTTP.
- **service**: regra de negócio e acesso ao banco (Prisma).

## Como chamar

### POST — registrar venda

```bash
curl -X POST https://SEU-APP.onrender.com/postbacks \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "hotmart",
    "transaction_id": "HP123456",
    "status": "approved",
    "product_id": "curso-ts",
    "product_name": "Curso de TypeScript",
    "amount_cents": 19990,
    "currency": "BRL",
    "customer_email": "cliente@exemplo.com",
    "occurred_at": "2026-10-24T14:30:00-03:00"
  }'
```

Respostas: `201 {"result":"created"}`, `200 {"result":"updated"}`, `200 {"result":"ignored"}`, `400` (payload inválido), `401` (token inválido).

`status` aceito: `pending`, `approved`, `refunded`, `chargeback`, `canceled`.

### GET — relatório

```bash
curl "https://SEU-APP.onrender.com/reports/sales?from=2026-10-01&to=2026-10-31&platform=hotmart"
```

Filtros opcionais: `from`, `to` (sobre `occurred_at`), `platform`, `product_id`.

```json
{
  "filters": { "from": "2026-10-01T00:00:00.000Z", "to": "2026-10-31T00:00:00.000Z", "platform": "hotmart", "productId": null },
  "currencies": {
    "BRL": {
      "revenueCents": 39980,
      "byStatus": {
        "approved": { "count": 2, "amountCents": 39980 },
        "refunded": { "count": 1, "amountCents": 19990 }
      },
      "topProducts": [{ "productId": "curso-ts", "sales": 2, "amountCents": 39980 }]
    }
  }
}
```

Também existe `GET /health`.

## Rodando localmente

```bash
cp .env.example .env          # preencha DATABASE_URL e WEBHOOK_TOKEN
npm install
npx prisma migrate dev --name init   # gera e aplica a migration (commite a pasta prisma/migrations)
npm run dev
```

Deploy: `npm run build` e `npm start` (que roda `prisma migrate deploy` antes de subir).

## Premissas e decisões

- **O contrato do payload é meu.** Não há plataforma específica no enunciado, então defini um formato único e simples. Na vida real eu faria um adaptador por plataforma que normaliza para este formato.
- **Idempotência.** Plataformas reenviam webhooks (timeout, retry). A venda é identificada por `(platform, transaction_id)` com índice único no banco; reentregas não duplicam nada. A garantia vem do banco, não de um "buscar antes de inserir", que falharia sob concorrência.
- **Eventos fora de ordem.** Cada venda guarda o estado do evento mais recente por `occurred_at`. Um `approved` que chega depois de um `refunded` não sobrescreve o reembolso. A comparação está no `WHERE` do update, então é atômica.
- **Ciclo de vida da venda.** Um novo evento da mesma transação (ex.: `approved` → `refunded`) atualiza a linha. O relatório conta receita só de vendas `approved` no estado atual.
- **Dinheiro em centavos inteiros**, nunca float. Limite de ~R$ 20 milhões por transação (coluna `Int`).
- **Moedas separadas.** O relatório agrupa por moeda e nunca soma moedas diferentes.
- **Autenticação do POST** por token compartilhado no header `x-webhook-token`, comparado em tempo constante. Qualquer um na internet poderia forjar vendas sem isso. O GET do relatório é aberto para facilitar a avaliação.
- **Códigos HTTP pensados para retry.** Payload inválido → 400 (retentar não ajuda); erro nosso → 500 (a plataforma reenvia). Reentrega/evento antigo → 200.
- **Payload bruto guardado** (`rawPayload`) para auditoria e reprocessamento.
- **Limite de body de 100 KB.**

### O que decidi não fazer

- **Verificação de assinatura HMAC por plataforma:** cada plataforma assina de um jeito; o token compartilhado cobre o essencial.
- **Fila/processamento assíncrono:** o processamento é um único upsert rápido, então responder síncrono é suficiente neste volume. Com muito tráfego eu enfileiraria.
- **Rate limiting, paginação/listagem de vendas, multi-tenant, testes automatizados:** fora do escopo das 3–4 horas. Testes seriam o primeiro próximo passo, em especial o service (duplicata, fora de ordem, concorrência).
- **Status desconhecidos são rejeitados (400)** em vez de aceitos às cegas. Trade-off: um status novo de uma plataforma é recusado até eu mapeá-lo.
# Desafio-TWR
