# LifeApp API Documentation

API REST para o Life Super App MVP 0.1.

## Base URL

```
http://localhost:4173
```

> **Nota:** Em produção, substitua pela URL do seu domínio.

---

## Endpoints

### `GET /api/health`

Verifica o status de saúde do serviço.

#### Request

- **Method:** `GET`
- **Headers:** nenhum requerido
- **Body:** nenhum

#### Response

**Status:** `200 OK`

```json
{
  "status": "ok",
  "service": "life-mvp",
  "time": "2026-08-30T06:08:55.146Z"
}
```

#### Headers

| Header | Valor |
|--------|-------|
| `Content-Type` | `application/json; charset=utf-8` |
| `Cache-Control` | `no-store` |

#### Erros

| Status | Resposta |
|--------|----------|
| `405` | `{ "error": { "code": "METHOD_NOT_ALLOWED", "message": "Método não permitido." } }` |

---

### `POST /api/checkout/quote`

Calcula a alocação de uma compra simulada. Retorna como propósito MVP uma simulação de cálculos financeiros.

#### Request

- **Method:** `POST`
- **Headers:**
  | Header | Valor |
  |--------|-------|
  | `Content-Type` | `application/json` |
- **Body:**

```json
{
  "gross": 100,
  "cashbackRate": 0.04
}
```

##### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `gross` | number | Sim | Valor bruto da compra (em BRL). Deve ser um número finito e não negativo. |
| `cashbackRate` | number | Não | Taxa de cashback (0-1). Por padrão: `0`. Deve ser um número finito entre 0 e 1. |

#### Response

**Status:** `200 OK`

```json
{
  "allocation": {
    "gross": 100,
    "platformFee": 15,
    "pspFee": 2.5,
    "cashbackEarned": 4,
    "merchantReceivable": 85,
    "eligibleLifeRevenue": 8.5,
    "condominiumShare": 0.85,
    "lifeNetRevenue": 7.65
  },
  "provider": "mock",
  "currency": "BRL"
}
```

##### Detalhamento dos valores

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `gross` | number | Valor bruto original |
| `platformFee` | number | Taxa de plataforma (15%) |
| `pspFee` | number | Taxa do provedor de pagamento (2,5%) |
| `cashbackEarned` | number | Valor de cashback ganho |
| `merchantReceivable` | number | Valor a receber pelo empreendedor |
| `eligibleLifeRevenue` | number | Receita elegível do Life (plataforma - PSP - cashback, mínimo 0) |
| `condominiumShare` | number | Parte do condomínio (10% da receita elegível) |
| `lifeNetRevenue` | number | Receita líquida do Life |

#### Erros

| Status | Resposta |
|--------|----------|
| `400` | `{ "error": { "code": "INVALID_MONEY", "message": "Não foi possível processar a solicitação." } }` |
| `400` | `{ "error": { "code": "INVALID_RATE", "message": "Não foi possível processar a solicitação." } }` |
| `400` | `{ "error": { "code": "INVALID_JSON", "message": "Não foi possível processar a solicitação." } }` |
| `405` | `{ "error": { "code": "METHOD_NOT_ALLOWED", "message": "Método não permitido." } }` |
| `413` | `{ "error": { "code": "PAYLOAD_TOO_LARGE", "message": "Não foi possível processar a solicitação." } }` |

---

## Regras de Negócio

### Cálculo Financeiro

1. **Taxa de plataforma:** 15% da receita bruta
2. **Taxa PSP:** 2,5% da receita bruta
3. **Cashback:** parte da receita bruta conforme taxa informada
4. **Receita Life elegível:** `plataforma - PSP - cashback` (floor em 0)
5. **Revenue share condominial:** 10% da receita Life elegível

### Arredondamento

- Todos os valores monetários são arredondados para centavos usando **half-up** (arredondamento normal)
- Taxas são mantidas como frações decimais (ex: 0.15 = 15%)

### Validações

- `gross` deve ser número finito e ≥ 0
- `cashbackRate` deve ser número finito entre 0 e 1
- Payload máximo: 64 KB

---

## Exemplos de Uso

### Verificar saúde do serviço

```bash
curl -X GET http://localhost:4173/api/health
```

```bash
# Resposta
{"status":"ok","service":"life-mvp","time":"2026-08-30T06:08:55.146Z"}
```

### Simular compra

```bash
curl -X POST http://localhost:4173/api/checkout/quote \
  -H "Content-Type: application/json" \
  -d '{"gross": 79.9, "cashbackRate": 0.1}'
```

```bash
# Resposta esperada
{
  "allocation": {
    "gross": 79.90,
    "platformFee": 12.0,
    "pspFee": 2.0,
    "cashbackEarned": 7.99,
    "merchantReceivable": 67.90,
    "eligibleLifeRevenue": 2.01,
    "condominiumShare": 0.20,
    "lifeNetRevenue": 1.81
  },
  "provider": "mock",
  "currency": "BRL"
}
```

### Fluxo completo (JavaScript fetch)

```javascript
async function simularCompra() {
  const response = await fetch('/api/checkout/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gross: 100,
      cashbackRate: 0.08
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Erro:', error.error.message);
    return;
  }

  const { allocation, provider, currency } = await response.json();
  console.log(`Cotação (${provider}, ${currency}):`);
  console.log(`Cashback ganho: R$ ${allocation.cashbackEarned}`);
  console.log(`Receita condomínio: R$ ${allocation.condominiumShare}`);
}
```

### Error handling

```bash
# Valor inválido
curl -X POST http://localhost:4173/api/checkout/quote \
  -H "Content-Type: application/json" \
  -d '{"gross": -10, "cashbackRate": 0.04}'

# Resposta
{"error":{"code":"INVALID_MONEY","message":"Não foi possível processar a solicitação."}}
```

---

## Limitações

⚠️ **Este é um MVP (Minimum Viable Product). Não use em produção.**

1. **Pagamento simulado:** Nenhuma transação real acontece
2. **Provider:** Sempre retorna `"mock"` como provider
3. **Currency:** Sempre retorna `"BRL"` (Real Brasileiro)
4. **Sem autenticação:** Não há verificação de identidade
5. **Dados em memória:** O servidor não persiste estados
6. **Sem auditoria:** Não há log de transações

---

## Próximos Passos para Produção

Segundo o roadmap do projeto, antes de qualquer deploy real são necessários:

- [ ] PostgreSQL como fonte da verdade
- [ ] Autenticação e autorização RBAC/contextual
- [ ] API NestJS
- [ ] Ledger financeiro persistente e auditável
- [ ] Integração real com PSP e webhooks assinados
- [ ] Conciliação, estorno, disputa e settlement
- [ ] Storage S3-compatible
- [ ] Logs de auditoria
- [ ] Notificações push
- [ ] Moderação
- [ ] Direitos LGPD
- [ ] Backups e restore testado