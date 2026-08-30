# Life MVP para Beta Operacional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evoluir o protótipo incorporado para um beta operacional sem permitir dinheiro real antes de backend persistente, segurança, auditoria e conciliação comprovadas.

**Architecture:** Manter o protótipo web como cliente demonstrativo enquanto se constrói um monólito modular com API NestJS, PostgreSQL como fonte da verdade, Redis para filas/cache e adapters para PSP e storage. O primeiro vertical slice será checkout → pagamento mock → ledger balanceado → cashback → revenue share, com idempotência e auditoria desde o início.

**Tech Stack:** Node.js >= 20.19, TypeScript, NestJS, Prisma, PostgreSQL, Redis, Docker Compose, React Native + Expo SDK 57, Next.js 16.3.x como alvo web de produção.

**Spec:** `docs/PRD.md` e `docs/ARCHITECTURE.md`

## Global Constraints

- Pagamento real permanece desabilitado até PSP, credenciais, contrato, webhooks assinados, conciliação e estorno serem testados.
- O Life nunca armazena PAN, CVV ou dados completos de cartão; coleta hospedada pelo PSP ou tokenização são obrigatórias.
- PostgreSQL é a fonte da verdade para pedidos, pagamentos, ledger, cashback, revenue share, consentimentos e auditoria.
- Todo efeito financeiro precisa ser idempotente, auditável, conciliável e representado por lançamentos balanceados.
- MFA é obrigatório para administradores Life, síndicos, operadores financeiros e operações sensíveis de empreendedores.
- Usuários só recebem o selo de compra verificada quando houver transação concluída vinculada ao produto ou serviço avaliado.
- Dados financeiros e jurídicos não podem depender de `localStorage` em produção.

---

## Decomposição de frentes

O PRD cobre subsistemas independentes. Execute e revise cada frente separadamente:

1. baseline web e contrato financeiro;
2. backend persistente e ledger;
3. identidade, autorização, privacidade e auditoria;
4. cliente web/mobile e operação.

Não iniciar a frente mobile ou integrações reais antes de o contrato da API e o vertical slice financeiro estarem estáveis.

### Task 1: Normalizar e provar o baseline do MVP

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Test: `tests/finance.test.mjs`
- Test: `server.mjs` via smoke test HTTP local

**Interfaces:**
- Consumes: `npm run dev`, `npm test` e `GET /api/health` já existentes.
- Produces: comandos documentados a partir da raiz do repo e uma prova repetível de que o protótipo inicia.

- [ ] **Step 1: Corrigir os comandos de execução documentados**

  Em `README.md`, remover `cd life-mvp` porque o conteúdo do pacote agora está na raiz do checkout. Documentar:

  ```bash
  npm test
  npm run dev
  ```

  Manter explícito que o pagamento é mock e que `localStorage` não é persistência de produção.

- [ ] **Step 2: Adicionar um script de verificação do baseline**

  Em `package.json`, adicionar o script:

  ```json
  "check": "npm test && node --check server.mjs"
  ```

- [ ] **Step 3: Gerar o lockfile do projeto raiz**

  Como o pacote atual ainda não possui dependências npm, gerar o lockfile sem instalar pacotes externos:

  ```bash
  npm install --package-lock-only
  ```

  O resultado esperado é `package-lock.json` versionável, permitindo que o CI use `npm ci`.

- [ ] **Step 4: Provar o fluxo local**

  Executar:

  ```bash
  npm run check
  npm run dev
  curl -fsS http://localhost:4173/api/health
  curl -fsS -X POST http://localhost:4173/api/checkout/quote \
    -H 'content-type: application/json' \
    -d '{"gross":100,"cashbackRate":0.04}'
  ```

  Esperar status HTTP 200, `{"status":"ok"}` no health check e `eligibleLifeRevenue:8.5` na cotação.

### Task 2: Fechar o contrato financeiro antes do banco

**Files:**
- Modify: `prototype/finance.js`
- Modify: `tests/finance.test.mjs`
- Create: `tests/finance-invariants.test.mjs`
- Modify: `server.mjs`

**Interfaces:**
- Consumes: `calculateAllocation({gross, platformFeeRate, pspFeeRate, cashbackRate, condoShareRate})`.
- Produces: alocação arredondada em centavos, invariantes testáveis e respostas HTTP que rejeitam entrada inválida.

- [ ] **Step 1: Escrever testes de invariantes financeiros**

  Cobrir pelo menos:

  ```js
  test('a alocação não gera receita de condomínio sem receita Life elegível', () => {
    const result = calculateAllocation({gross: 100, cashbackRate: 0.2});
    assert.equal(result.eligibleLifeRevenue, 0);
    assert.equal(result.condominiumShare, 0);
    assert.equal(result.lifeNetRevenue, 0);
  });

  test('taxas inválidas são rejeitadas', () => {
    assert.throws(() => calculateAllocation({gross: 100, cashbackRate: 1.1}), /INVALID_RATE/);
    assert.throws(() => calculateAllocation({gross: -1}), /INVALID_GROSS/);
  });
  ```

- [ ] **Step 2: Definir a representação balanceada do ledger**

  Para uma ordem de R$ 100,00, registrar lançamentos assinados que somem zero:

  ```text
  Customer/PSP receivable        +100.00
  Merchant payable                -80.00
  PSP fee expense/payable          -3.00
  Cashback provision               -5.00
  Condominium participation        -1.20
  Life net revenue               -10.80
  Total                            +0.00
  ```

  O valor bruto da receita Life deve permanecer subtotal derivado, nunca um segundo lançamento para a mesma transação.

- [ ] **Step 3: Rejeitar payloads inválidos no endpoint de cotação**

  O endpoint `POST /api/checkout/quote` deve responder `400` com código estável para JSON inválido, `gross` negativo, taxa fora de `[0,1]` e corpo acima de 64 KiB. Manter os códigos `INVALID_GROSS`, `INVALID_RATE` e `PAYLOAD_TOO_LARGE` nos testes.

- [ ] **Step 4: Executar a suíte financeira**

  ```bash
  npm test
  ```

  Esperar todos os testes passarem antes de iniciar o schema persistente.

### Task 3: Construir o backend persistente do primeiro vertical slice

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/orders/orders.module.ts`
- Create: `apps/api/src/payments/payments.module.ts`
- Create: `apps/api/src/ledger/ledger.module.ts`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`
- Create: `apps/api/test/health.e2e-spec.ts`
- Modify: `compose.yml`

**Interfaces:**
- Consumes: alocação financeira validada da Task 2.
- Produces: `GET /health`, `POST /checkout/quotes`, criação de ordem idempotente e registros persistentes de pagamento e ledger.

- [ ] **Step 1: Definir as entidades mínimas do schema**

  Criar entidades para `User`, `Condominium`, `Merchant`, `Product`, `Order`, `Payment`, `LedgerTransaction`, `LedgerEntry`, `CashbackAccount`, `Consent` e `AuditEvent`. Usar IDs UUID, valores monetários inteiros em centavos, `createdAt`/`updatedAt`, e índices para `Order.externalId`, `Payment.providerEventId` e `LedgerEntry.transactionId`.

- [ ] **Step 2: Adicionar PostgreSQL ao ambiente de desenvolvimento**

  Manter o serviço `postgres` de `compose.yml` e documentar:

  ```bash
  docker compose up -d postgres
  cd apps/api
  npx prisma migrate dev --name initial_financial_slice
  npm test
  ```

  Não usar o banco local como substituto da prova de backup/restore.

- [ ] **Step 3: Implementar criação idempotente de ordem**

  Exigir uma chave `Idempotency-Key` em `POST /checkout/orders`. Uma segunda requisição com a mesma chave e payload deve retornar a mesma ordem; a mesma chave com payload diferente deve responder `409 IDEMPOTENCY_KEY_REUSED`.

- [ ] **Step 4: Persistir o journal balanceado em uma transação SQL**

  A confirmação mock deve inserir uma `LedgerTransaction`, todas as `LedgerEntry` e o estado do `Payment` na mesma transação. Rejeitar a operação se a soma dos lançamentos em centavos não for zero.

- [ ] **Step 5: Testar rollback e repetição**

  Cobrir criação, repetição idempotente, chave reutilizada com payload divergente, falha no journal e consulta do recibo. Executar os testes contra PostgreSQL descartável, não contra `localStorage`.

### Task 4: Implementar identidade, autorização e confiança

**Files:**
- Create: `apps/api/src/auth/`
- Create: `apps/api/src/authorization/`
- Create: `apps/api/src/consents/`
- Create: `apps/api/src/audit/`
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `docs/MVP-STATUS.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: `User`, `Condominium`, `Order`, `Payment` e `AuditEvent` da Task 3.
- Produces: sessões autenticadas, RBAC + validação contextual, MFA obrigatório para perfis sensíveis e aceite jurídico versionado.

- [ ] **Step 1: Definir a matriz de papéis**

  Implementar os papéis `resident`, `dependent`, `doorman`, `staff`, `condominium_admin`, `syndic`, `merchant`, `merchant_staff`, `moderator`, `life_admin` e `finance_operator`, com autorização por condomínio, recurso e ação.

- [ ] **Step 2: Bloquear operações sensíveis sem MFA**

  Exigir MFA para administradores Life, síndicos e operadores financeiros em áreas administrativas/financeiras, e para empreendedores/equipes antes de pagamentos, reembolsos, alteração bancária, gestão de equipe ou acesso a dados protegidos.

- [ ] **Step 3: Versionar consentimentos e auditoria**

  Registrar usuário, versão, timestamp, finalidade e evidência do aceite. Auditar login, mudança de papel, criação/alteração de dados bancários, pagamento, reembolso, estorno, concessão de cashback e exportação/exclusão de dados.

- [ ] **Step 4: Testar negação de acesso**

  Criar testes para isolamento entre condomínios, acesso sem papel, acesso sem MFA e tentativas de alterar ordens ou ledger de outro usuário.

### Task 5: Substituir o estado local no cliente e preservar o mock

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/index.html`
- Modify: `apps/mobile/App.tsx`
- Create: `prototype/api.js`
- Create: `tests/checkout-client-contract.test.mjs`
- Modify: `docs/MVP-STATUS.md`

**Interfaces:**
- Consumes: endpoints autenticados de checkout, recibo, wallet, reviews e consentimento das Tasks 3–4.
- Produces: cliente web e shell Expo usando API; o mock só permanece selecionável em ambiente de desenvolvimento.

- [ ] **Step 1: Isolar chamadas HTTP do estado de tela**

  Mover chamadas `fetch` para `prototype/api.js`, definir tratamento comum de erro e incluir `Idempotency-Key` em cada tentativa de confirmação.

- [ ] **Step 2: Remover dependência financeira de `localStorage`**

  Manter apenas preferências não sensíveis localmente. Wallet, pedidos, ledger, aceites e reputação devem ser lidos da API e atualizados por resposta do servidor.

- [ ] **Step 3: Impedir selo de compra verificada no cliente**

  O cliente deve exibir o selo somente quando a API retornar `verifiedPurchase: true`; nunca inferir o selo por texto, estado local ou simples existência de avaliação.

- [ ] **Step 4: Testar checkout web e mobile contra o mesmo contrato**

  Validar cotação, confirmação, repetição da requisição, recibo, cashback e participação do condomínio com dados mock controlados.

### Task 6: Preparar operação beta e só então avaliar dinheiro real

**Files:**
- Modify: `compose.yml`
- Create: `.github/workflows/ci.yml`
- Create: `docs/runbooks/backup-restore.md`
- Create: `docs/runbooks/payment-incident.md`
- Modify: `docs/MVP-STATUS.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: testes e métricas das Tasks 1–5.
- Produces: CI reproduzível, observabilidade mínima, backup/restore comprovado e checklist de beta operacional.

- [ ] **Step 1: Automatizar qualidade no CI**

  Executar em cada push e pull request:

  ```bash
  npm ci
  npm run check
  npm test
  ```

  Adicionar job separado para testes da API com PostgreSQL e Redis de serviço.

- [ ] **Step 2: Provar backup e restore**

  Documentar e executar dump, restauração em banco limpo, verificação de contagem de ordens/lançamentos e reconciliação de um pedido conhecido.

- [ ] **Step 3: Definir observabilidade e incidentes**

  Emitir logs estruturados sem PAN/CVV, métricas de falha de pagamento, latência, divergência de ledger e fila de webhooks; documentar contenção e reconciliação.

- [ ] **Step 4: Atualizar o critério de beta**

  Só marcar o MVP como beta operacional quando pagamento, ledger, autenticação, autorização, auditoria, conciliação, LGPD e backup/restore tiverem testes executados e evidências registradas em `docs/MVP-STATUS.md`.

---

## Ordem recomendada agora

1. Executar Task 1 e corrigir o README para o repo na raiz.
2. Executar Task 2 e congelar o contrato financeiro balanceado.
3. Executar Task 3 com PostgreSQL e confirmação mock idempotente.
4. Executar Task 4 antes de qualquer PSP real ou exposição externa.
5. Migrar web/mobile pela Task 5.
6. Fechar CI, backup, restore e incidentes na Task 6.

## Gaps conhecidos

- O backend NestJS ainda não existe; `apps/api/src/` está vazio.
- O web MVP é um servidor estático Node com estado e regras no cliente.
- O mobile Expo é uma fundação visual, não uma aplicação conectada à API.
- Não há migrações, autenticação, RBAC implementado, storage, webhooks, conciliação ou pipeline CI.
