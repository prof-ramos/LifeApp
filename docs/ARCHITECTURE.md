# ARCHITECTURE.md — Life Super App

> Documento vivo de arquitetura do **Life Super App**.  
> Deve ser atualizado sempre que houver alteração relevante em componentes, dependências estruturais, integrações, modelo de dados, segurança ou infraestrutura.

---

# 1. Project Structure

O Life utilizará uma arquitetura **monorepo**, com separação clara entre aplicações, pacotes compartilhados, infraestrutura e documentação.

```text
life/
├── apps/
│   ├── api/                         # Backend principal
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   │
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── profiles/
│   │   │   │   ├── condominiums/
│   │   │   │   ├── units/
│   │   │   │   ├── announcements/
│   │   │   │   ├── parcels/
│   │   │   │   ├── visitors/
│   │   │   │   ├── reservations/
│   │   │   │   ├── occurrences/
│   │   │   │   │
│   │   │   │   ├── merchants/
│   │   │   │   ├── products/
│   │   │   │   ├── services/
│   │   │   │   ├── schedules/
│   │   │   │   ├── orders/
│   │   │   │   ├── checkout/
│   │   │   │   │
│   │   │   │   ├── payments/
│   │   │   │   ├── ledger/
│   │   │   │   ├── wallets/
│   │   │   │   ├── cashback/
│   │   │   │   ├── settlements/
│   │   │   │   ├── revenue-share/
│   │   │   │   │
│   │   │   │   ├── social/
│   │   │   │   ├── posts/
│   │   │   │   ├── comments/
│   │   │   │   ├── reactions/
│   │   │   │   ├── reviews/
│   │   │   │   ├── reputation/
│   │   │   │   ├── follows/
│   │   │   │   │
│   │   │   │   ├── insights/
│   │   │   │   ├── recommendations/
│   │   │   │   ├── explore/
│   │   │   │   ├── notifications/
│   │   │   │   ├── moderation/
│   │   │   │   ├── reports/
│   │   │   │   ├── audit/
│   │   │   │   └── admin/
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── filters/
│   │   │   │   ├── middleware/
│   │   │   │   ├── pipes/
│   │   │   │   └── utils/
│   │   │   │
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   ├── jobs/
│   │   │   └── realtime/
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   │
│   │   ├── test/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── web/                         # WebApp
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (public)/
│   │   │   │   ├── (auth)/
│   │   │   │   ├── (resident)/
│   │   │   │   ├── (merchant)/
│   │   │   │   ├── (condominium)/
│   │   │   │   └── (admin)/
│   │   │   │
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── services/
│   │   │   └── stores/
│   │   │
│   │   ├── public/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── mobile/                      # iOS + Android
│       ├── app/
│       │   ├── (auth)/
│       │   ├── (tabs)/
│       │   ├── marketplace/
│       │   ├── merchant/
│       │   ├── condominium/
│       │   ├── social/
│       │   ├── insights/
│       │   ├── wallet/
│       │   └── profile/
│       │
│       ├── src/
│       │   ├── components/
│       │   ├── features/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── stores/
│       │   ├── lib/
│       │   └── utils/
│       │
│       ├── assets/
│       ├── tests/
│       ├── app.json
│       └── package.json
│
├── packages/
│   ├── contracts/                   # Contratos compartilhados API ↔ clientes
│   ├── types/                       # Tipos TypeScript compartilhados
│   ├── schemas/                     # Validações Zod
│   ├── business-rules/              # Regras puras reutilizáveis
│   ├── design-tokens/               # Cores, spacing, tipografia etc.
│   ├── analytics/                   # Eventos e contratos de analytics
│   ├── config/                      # Configurações compartilhadas
│   ├── eslint-config/
│   └── typescript-config/
│
├── infrastructure/
│   ├── docker/
│   ├── caddy/
│   ├── postgres/
│   ├── redis/
│   ├── minio/
│   ├── monitoring/
│   └── backup/
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── BACKUP-RESTORE.md
│   └── ADR/
│
├── scripts/
│   ├── bootstrap/
│   ├── database/
│   ├── backup/
│   ├── restore/
│   └── deploy/
│
├── .github/
│   └── workflows/
│
├── compose.yml
├── compose.production.yml
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── ARCHITECTURE.md
```

## 1.1. Organização arquitetural

O projeto utilizará:

- **monorepo**;
- **monólito modular no backend**;
- frontend Web independente;
- aplicação mobile compartilhada entre iOS e Android;
- PostgreSQL como fonte primária da verdade;
- separação explícita entre domínio, infraestrutura e interfaces;
- código compartilhado somente quando existir benefício real.

Não deverão ser criados microserviços sem necessidade operacional comprovada.

---

# 2. High-Level System Diagram

```text
                   ┌──────────────────────┐
                   │       Usuários       │
                   │                      │
                   │ Morador              │
                   │ Empreendedor         │
                   │ Síndico              │
                   │ Portaria             │
                   │ Staff                │
                   │ Administrador Life   │
                   └──────────┬───────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
     ┌──────────────────┐           ┌──────────────────┐
     │   Mobile App     │           │      WebApp      │
     │ React Native     │           │     Next.js      │
     │ Expo             │           │                  │
     │ iOS + Android    │           │ Web + PWA        │
     └────────┬─────────┘           └────────┬─────────┘
              │                              │
              └──────────────┬───────────────┘
                             │ HTTPS
                             ▼
                   ┌────────────────────┐
                   │     Caddy Proxy    │
                   │ TLS / Routing      │
                   └─────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │      NestJS API     │
                  │                     │
                  │ Monólito modular    │
                  │ REST + WebSocket    │
                  └──────────┬──────────┘
                             │
         ┌───────────────────┼────────────────────┐
         │                   │                    │
         ▼                   ▼                    ▼
┌────────────────┐   ┌────────────────┐  ┌────────────────┐
│   PostgreSQL   │   │     Redis      │  │     MinIO      │
│                │   │                │  │                │
│ Dados core     │   │ Cache          │  │ Fotos          │
│ Financeiro     │   │ Queue          │  │ Produtos       │
│ Social         │   │ Locks          │  │ Posts          │
│ Marketplace    │   │ Rate Limit     │  │ Documentos     │
└────────────────┘   └────────────────┘  └────────────────┘
         │
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                 Serviços Externos                       │
├─────────────────────────────────────────────────────────┤
│ PSP / pagamentos                                       │
│ Push notifications                                     │
│ E-mail                                                 │
│ SMS/WhatsApp, quando aplicável                         │
│ Mapas / geolocalização                                 │
│ Serviços antifraude, quando aplicável                  │
└─────────────────────────────────────────────────────────┘
```

## 2.1. Fluxo geral de dados

```text
Cliente
  ↓
HTTPS
  ↓
API NestJS
  ↓
Autenticação + autorização
  ↓
Serviço de domínio
  ↓
Transação
  ↓
PostgreSQL
  ↓
Evento interno
  ├── Redis / worker
  ├── WebSocket
  ├── push
  └── integração externa
```

---

# 3. Core Components

## 3.1. Mobile App

**Nome:** Life Mobile

**Descrição:**  
Aplicação principal utilizada pelos moradores e consumidores do ecossistema Life.

Também poderá ser utilizada por empreendedores e funcionários para operações rápidas.

### Responsabilidades

- autenticação;
- Home personalizada;
- funcionalidades condominiais;
- marketplace;
- compras;
- contratação de serviços;
- checkout;
- pagamentos;
- Life Wallet;
- cashback;
- rede social;
- perfil;
- avaliações;
- Insights;
- Explorar;
- notificações;
- QR Codes;
- câmera;
- geolocalização.

### Tecnologias

- React Native;
- Expo;
- TypeScript;
- Expo Router;
- TanStack Query;
- Zustand;
- React Hook Form;
- Zod.

### Deployment

- Apple App Store;
- Google Play;
- Expo EAS para build e distribuição.

---

## 3.2. Web Application

**Nome:** Life Web

**Descrição:**  
WebApp responsivo para acesso ao ecossistema Life por navegador e principal interface administrativa.

### Perfis principais

- morador;
- empreendedor;
- síndico;
- administração condominial;
- portaria;
- staff;
- administrador Life.

### Uso prioritário

O WebApp será especialmente importante para:

- dashboards;
- gráficos;
- gestão financeira;
- gestão de produtos;
- gestão de serviços;
- gestão de pedidos;
- gestão condominial;
- administração;
- moderação;
- relatórios.

### Tecnologias

- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- shadcn/ui;
- TanStack Query;
- React Hook Form;
- Zod.

### Deployment

Self-hosted em container Docker.

---

# 4. Backend Services

## 4.1. Life Core API

**Nome:** Life API

**Descrição:**  
Backend central responsável pelas regras de negócio e acesso aos dados.

### Tecnologias

- Node.js;
- NestJS;
- TypeScript;
- Prisma;
- PostgreSQL;
- Redis.

### Arquitetura

**Monólito modular.**

Cada domínio deverá possuir separação própria de:

```text
controller
service
domain
repository
dto
entities
events
tests
```

Não deverão existir acessos indiscriminados ao banco entre módulos.

---

# 5. Backend Modules

## 5.1. Authentication

Responsável por:

- cadastro;
- login;
- logout;
- refresh token;
- recuperação de conta;
- MFA obrigatório para os perfis e operações definidos na seção 27.1;
- gerenciamento de sessões;
- revogação.

---

## 5.2. Users & Profiles

Responsável por:

- dados do usuário;
- perfil social;
- preferências;
- configurações;
- privacidade;
- múltiplos papéis.

---

## 5.3. Condominium

Responsável por:

- condomínios;
- unidades;
- moradores;
- vínculos;
- papéis internos;
- configurações.

---

## 5.4. Condominium Operations

Inclui:

- comunicados;
- encomendas;
- visitantes;
- reservas;
- ocorrências;
- portaria;
- manutenção.

---

## 5.5. Marketplace

Responsável por:

- empreendedores;
- lojas;
- produtos;
- serviços;
- categorias;
- disponibilidade;
- busca;
- ofertas.

---

## 5.6. Orders

Responsável pelo ciclo de vida das compras e serviços.

### Produto

```text
created
→ awaiting_payment
→ paid
→ confirmed
→ preparing
→ ready
→ delivering
→ completed
```

### Serviço

```text
created
→ awaiting_payment
→ paid
→ accepted
→ scheduled
→ in_progress
→ completed
```

Estados adicionais:

- cancelled;
- refunded;
- disputed.

Transições deverão ser explicitamente validadas.

---

# 6. Payments

## 6.1. Payment Module

Responsável por:

- criação de cobrança;
- Pix;
- cartão;
- confirmação;
- webhooks;
- estornos;
- reembolsos;
- conciliação;
- integração com PSP.

O Life não deverá armazenar diretamente números completos de cartões.

---

# 7. Financial Ledger

O **ledger é componente crítico** e deverá ser implementado desde o MVP.

A aplicação não poderá depender apenas de campos mutáveis como:

```text
wallet.balance
merchant.balance
condominium.balance
```

A fonte da verdade será composta por lançamentos financeiros.

## Exemplo

```text
Transaction: ORDER-123

Ledger postings (signed entries must sum to zero)

Customer/PSP receivable        +100.00
Merchant payable                -80.00
PSP fee expense/payable          -3.00
Cashback provision               -5.00
Condominium participation        -1.20
Life net revenue               -10.80
Total                            +0.00
```

`Life gross revenue` (`12.00`) is a derived subtotal, not a separate posting:
`10.80` of net revenue plus `1.20` of condominium participation. Never persist
gross and net revenue as independent ledger entries for the same transaction.

Toda movimentação deverá ser:

- auditável;
- rastreável;
- idempotente;
- conciliável.

---

# 8. Cashback

## 8.1. Cashback Engine

Responsável por:

- campanhas;
- regras;
- elegibilidade;
- cálculo;
- emissão;
- utilização;
- expiração;
- estorno;
- antifraude.

### Fontes possíveis

- Life;
- empreendedor;
- campanha conjunta;
- parceiro comercial.

---

## 8.2. Life Wallet

A carteira deverá exibir:

- cashback disponível;
- cashback pendente;
- cashback expirando;
- créditos promocionais;
- histórico.

O cashback deverá ser contabilmente separado de valores monetários sacáveis.

---

# 9. Condominium Revenue Share

O condomínio parceiro terá direito, conforme contrato, a:

> **10% da receita atribuível ao Life originada das operações vinculadas ao respectivo condomínio.**

## Fórmula conceitual

```text
condominiumRevenue =
eligibleLifeRevenue × 0.10
```

Não calcular diretamente sobre GMV.

### Exemplo

```text
Compra                   R$ 100,00
Receita Life             R$  12,00

Participação condomínio:
R$ 12,00 × 10%

= R$ 1,20
```

O lançamento deverá ser registrado no ledger.

---

# 10. Social Network

## Responsabilidades

- posts;
- comentários;
- reações;
- compartilhamento;
- avaliações;
- seguidores/conexões;
- reputação;
- denúncias;
- bloqueios.

O módulo social deverá ser integrado ao marketplace.

Exemplo:

```text
Compra
  ↓
Conclusão
  ↓
Avaliação verificada
  ↓
Feed
  ↓
Reputação
  ↓
Algoritmo de recomendação
```

---

# 11. Reviews & Reputation

## Avaliações

Deverão suportar:

- 1–5 estrelas;
- comentário;
- mídia opcional;
- avaliação verificada;
- resposta do empreendedor;
- denúncia.

## Reputation Engine

Não utilizar apenas média aritmética simples.

Poderá considerar:

```text
rating
volume
recency
verifiedPurchase
cancellationRate
complaintRate
resolutionRate
reviewerTrust
```

A fórmula deverá permanecer auditável.

---

# 12. Recommendation Engine

Inicialmente será baseado em regras e scoring.

Não dependerá de machine learning no MVP.

## Entradas

- histórico;
- categoria;
- horário;
- localização;
- condomínio;
- comportamento;
- reputação;
- cashback disponível;
- ofertas;
- preferências.

## Exemplo

```text
recommendation_score =
    affinity_score
  + proximity_score
  + reputation_score
  + cashback_score
  + recency_score
  + popularity_score
```

Pesos deverão ser configuráveis.

---

# 13. Insights

Responsável pela análise dos gastos do usuário.

## Dados

- gastos;
- categorias;
- evolução;
- cashback recebido;
- cashback usado;
- economia;
- ticket médio.

## Visualizações

- gráfico temporal;
- gastos por categoria;
- evolução mensal;
- uso de cashback;
- economia acumulada.

## Recomendação

Exemplo:

```text
Usuário possui R$ 30 de cashback
          +
Histórico mostra alta frequência em alimentação
          +
Restaurante próximo possui promoção
          ↓
"Use R$ 20 do seu cashback e economize nesta compra."
```

---

# 14. Explore

Responsável por conteúdo próprio e links externos.

## Conteúdos

- condomínio;
- casa;
- manutenção;
- cidade;
- eventos;
- finanças;
- consumo;
- parceiros;
- publicidade.

Links deverão passar por validação antes de serem publicados.

---

# 15. Data Stores

## 15.1. PostgreSQL

**Nome:** Life Primary Database

**Tipo:** PostgreSQL

**Propósito:**  
Fonte principal da verdade do sistema.

### Principais entidades

```text
users
profiles
roles
permissions

condominiums
units
memberships

announcements
parcels
visitors
reservations
occurrences

merchants
merchant_users
products
product_variants
services
service_availability

orders
order_items

payments
payment_events
refunds

ledger_accounts
ledger_entries
financial_transactions

wallets
cashback_entries
cashback_campaigns

condominium_revenue_share
settlements

posts
comments
reactions
follows

reviews
reputation_snapshots

recommendations

external_content

notifications

audit_logs
moderation_cases
reports
```

---

# 16. Redis

**Nome:** Life Redis

**Tipo:** Redis

## Uso

- cache;
- rate limiting;
- locks;
- filas;
- jobs;
- tokens temporários;
- sessões específicas;
- deduplicação.

Redis não deverá armazenar dados financeiros como fonte definitiva.

---

# 17. Object Storage

## Nome

Life Object Storage

## Tecnologia inicial

**MinIO**

Compatível com protocolo S3.

## Armazenamento

- avatares;
- fotos de produtos;
- imagens de posts;
- anexos;
- comprovantes;
- documentos;
- arquivos de ocorrência.

### Regra arquitetural

O código deverá utilizar abstração S3-compatible para permitir migração futura para:

- AWS S3;
- Cloudflare R2;
- Backblaze B2;
- outro storage compatível.

---

# 18. External Integrations / APIs

## 18.1. Payment Service Provider

**Função:** processamento financeiro.

### Requisitos

- Pix;
- cartões;
- marketplace;
- split;
- recebedores;
- webhooks;
- reembolsos;
- conciliação.

A implementação deverá utilizar adapter.

```text
PaymentProvider
      │
      ├── PagarMeAdapter
      ├── MercadoPagoAdapter
      └── FutureProviderAdapter
```

O domínio não deverá depender diretamente de um PSP específico.

---

# 19. Push Notifications

Utilizado para:

- encomendas;
- pedidos;
- visitantes;
- reservas;
- cashback;
- promoções;
- interações sociais.

No mobile, deverá ser integrada à infraestrutura do Expo/APNs/FCM conforme plataforma.

---

# 20. E-mail

Utilizado para:

- confirmação de conta;
- recuperação;
- documentos;
- eventos de segurança;
- comunicações transacionais.

O fornecedor deverá permanecer desacoplado por adapter.

---

# 21. Maps & Geolocation

Utilizado para:

- estabelecimentos próximos;
- prestadores;
- raio de atendimento;
- recomendações locais.

Evitar armazenar histórico de localização contínuo sem necessidade funcional.

---

# 22. Deployment & Infrastructure

## Modelo

**Self-hosted.**

## Containerização

Docker.

## Orquestração inicial

Docker Compose.

### Serviços mínimos

```text
life-proxy
life-web
life-api
life-postgres
life-redis
life-minio
```

Opcionalmente:

```text
life-worker
life-monitoring
life-backup
```

---

# 23. Reverse Proxy

## Tecnologia preferencial

Caddy.

### Responsabilidades

- TLS;
- HTTPS;
- routing;
- headers;
- compressão;
- proxy reverso.

Exemplo:

```text
app.life.com.br
       ↓
Next.js

api.life.com.br
       ↓
NestJS

storage.life.com.br
       ↓
MinIO
```

---

# 24. Kubernetes

**Não utilizar no MVP.**

A complexidade operacional não se justifica inicialmente.

Avaliar Kubernetes apenas quando houver necessidade real de:

- múltiplos hosts;
- auto scaling;
- alta disponibilidade distribuída;
- grande escala;
- deploys independentes complexos.

---

# 25. CI/CD

## Ferramenta

GitHub Actions.

### Pipeline

```text
Pull Request
   ↓
Lint
   ↓
Type Check
   ↓
Unit Tests
   ↓
Integration Tests
   ↓
Build
   ↓
Security Checks
```

Branch principal:

```text
merge
 ↓
build images
 ↓
tag
 ↓
push registry
 ↓
deploy
 ↓
health check
```

Produção deverá exigir controles adicionais.

---

# 26. Monitoring & Logging

## Logs

Logs estruturados em JSON.

Deverão conter:

- request ID;
- user ID quando apropriado;
- módulo;
- operação;
- duração;
- status.

Não registrar:

- senha;
- JWT completo;
- cartão;
- CVV;
- documentos desnecessários;
- secrets.

---

## Métricas

Monitorar:

- CPU;
- memória;
- disco;
- latência;
- erros;
- conexões PostgreSQL;
- Redis;
- requests;
- filas;
- pagamentos;
- jobs.

---

## Ferramentas

Stack inicial possível:

- Prometheus;
- Grafana;
- Loki.

Sentry poderá complementar monitoramento de aplicação.

---

# 27. Security Considerations

Segurança será requisito transversal.

---

## 27.1. Authentication

### Tecnologia

- access tokens de curta duração;
- refresh tokens rotativos;
- cookies `HttpOnly` no Web quando aplicável;
- armazenamento seguro no mobile.

### MFA

MFA é obrigatório para:

- administradores Life, síndicos e operadores financeiros, em qualquer acesso administrativo, financeiro ou de gestão;
- empreendedores e suas equipes, antes de operações sensíveis, como pagamentos, reembolsos, alterações de dados bancários, gestão de equipe ou acesso a dados protegidos.

O sistema deverá bloquear essas funções sem MFA validado. Para os demais perfis e operações de baixo risco, MFA poderá ser recomendado, mas não substitui as exigências obrigatórias acima.

---

# 28. Authorization

Utilizar:

**RBAC + validação contextual.**

Papéis:

```text
resident
dependent
doorman
staff
condominium_admin
syndic
merchant
merchant_staff
moderator
life_admin
```

RBAC isoladamente não será suficiente.

Exemplo:

Um síndico pode ter permissão:

```text
READ_CONDOMINIUM_FINANCE
```

mas somente para:

```text
condominium_id
```

ao qual está vinculado.

---

# 29. Multi-tenancy

Condomínios constituem fronteiras lógicas relevantes.

Toda consulta sensível deverá considerar:

```text
user
+
role
+
tenant
+
resource ownership
```

Nunca confiar no `condominiumId` enviado pelo frontend sem validação no backend.

---

# 30. Encryption

## Em trânsito

TLS obrigatório.

## Em repouso

Criptografia de discos/volumes quando suportada.

Campos excepcionalmente sensíveis poderão utilizar criptografia em nível de aplicação.

---

# 31. Secrets

Secrets nunca deverão estar:

- no Git;
- dentro da imagem Docker;
- no frontend;
- em logs.

Exemplos:

```text
DATABASE_PASSWORD
JWT_PRIVATE_KEY
PAYMENT_API_KEY
SMTP_PASSWORD
MINIO_SECRET_KEY
```

Produção deverá utilizar mecanismo seguro de secrets.

---

# 32. API Security

Implementar:

- DTO validation;
- rate limiting;
- CORS restritivo;
- headers seguros;
- limites de payload;
- proteção contra brute force;
- sanitização;
- validação de upload;
- idempotency keys;
- logs de auditoria.

---

# 33. Financial Security

Todas as operações financeiras deverão utilizar:

- idempotência;
- transações de banco;
- webhooks assinados;
- conciliação;
- audit trail;
- regras de estado.

Exemplo:

```text
PSP webhook
    ↓
signature validation
    ↓
event duplication check
    ↓
database transaction
    ↓
payment state update
    ↓
ledger entries
    ↓
cashback
    ↓
revenue share
```

---

# 34. LGPD

A arquitetura deverá seguir:

- privacy by design;
- privacy by default;
- minimização;
- finalidade;
- transparência;
- controle de acesso;
- retenção definida;
- auditabilidade.

Aceite de Termos de Uso não substitui obrigações legais.

---

# 35. Consent & Legal Documents

Registrar:

```text
user_id
document_type
document_version
accepted_at
acceptance_context
```

Documentos incluem:

- Termos de Uso;
- Política de Privacidade;
- Marketplace;
- Cashback;
- avaliações;
- contratos comerciais.

---

# 36. Audit Log

Eventos críticos deverão ser auditados.

Exemplos:

```text
LOGIN_ADMIN
CHANGE_USER_ROLE
REFUND_PAYMENT
MODIFY_CASHBACK
MODIFY_REVENUE_SHARE
BAN_USER
CHANGE_ORDER_STATUS
UPDATE_MERCHANT_BANK_DATA
DELETE_PERSONAL_DATA
```

Audit logs não poderão ser alterados por usuários comuns.

---

# 37. Backup & Disaster Recovery

Backups são obrigatórios.

## PostgreSQL

Implementar:

- backup completo periódico;
- retenção;
- cópia off-site;
- testes de restauração.

Idealmente evoluir para:

- WAL archiving;
- Point-in-Time Recovery.

---

## MinIO

Utilizar:

- replicação/cópia;
- versionamento quando aplicável;
- backup externo.

---

## Regra

> Backup não testado não deve ser considerado backup válido.

Procedimentos de recuperação deverão estar em:

```text
docs/BACKUP-RESTORE.md
```

---

# 38. Development Environment

## Requisitos

- Node.js LTS;
- pnpm;
- Docker;
- Docker Compose;
- Git.

## Inicialização

```text
git clone <repository>
cd life

cp .env.example .env

pnpm install

docker compose up -d postgres redis minio

pnpm db:migrate
pnpm db:seed

pnpm dev
```

---

# 39. Package Management

Utilizar:

**pnpm**

Workspace:

```text
apps/*
packages/*
```

---

# 40. Monorepo Tooling

Utilizar:

**Turborepo**

Responsável por:

- builds;
- cache;
- pipelines;
- execução paralela;
- dependências internas.

---

# 41. Testing

## Backend

- Jest;
- Supertest;
- testes unitários;
- testes de integração;
- testes de contrato;
- E2E.

## Web

- Vitest ou Jest;
- React Testing Library;
- Playwright para E2E.

## Mobile

- Jest;
- React Native Testing Library;
- testes E2E em fluxos críticos quando aplicável.

---

# 42. Testes Financeiros

Cobertura especialmente rigorosa para:

- cashback;
- pagamentos;
- ledger;
- revenue share;
- refunds;
- settlements.

Exemplo:

```text
R$100 venda
↓
cancelamento
↓
R$0 receita efetiva
↓
R$0 cashback definitivo
↓
R$0 participação condomínio
```

Esse comportamento deverá possuir teste automatizado.

---

# 43. Code Quality

Utilizar:

- ESLint;
- Prettier;
- TypeScript strict;
- Husky opcional;
- lint-staged opcional.

Build de produção não deverá ignorar erros de TypeScript.

---

# 44. API Contracts

Todos os contratos deverão ser tipados.

Preferência:

```text
packages/contracts
```

Frontend e backend não deverão criar independentemente formatos incompatíveis para o mesmo recurso.

---

# 45. Validation

Validação ocorrerá nos limites do sistema.

Frontend:

- UX;
- feedback imediato.

Backend:

- autoridade final.

O backend nunca deverá confiar em validações executadas exclusivamente pelo cliente.

---

# 46. Error Model

Adotar formato consistente.

Exemplo:

```json
{
  "error": {
    "code": "INSUFFICIENT_CASHBACK_BALANCE",
    "message": "Saldo de cashback insuficiente.",
    "requestId": "req_xxx"
  }
}
```

Clientes deverão utilizar `code`, não comparação textual de mensagens.

---

# 47. Realtime

Inicialmente:

- WebSocket;
- SSE quando mais apropriado.

Casos:

- status de pedidos;
- notificações;
- comentários;
- interações;
- eventos da portaria.

Não utilizar realtime onde polling ou refresh simples for suficiente.

---

# 48. Background Jobs

Jobs assíncronos poderão processar:

- notificações;
- e-mails;
- expiração de cashback;
- geração de relatórios;
- reconciliação;
- processamento de imagens;
- tarefas recorrentes.

Inicialmente Redis poderá sustentar as filas.

---

# 49. Search

MVP:

PostgreSQL.

Utilizar:

- índices;
- full-text search;
- trigram quando necessário.

Não adicionar Elasticsearch/OpenSearch inicialmente.

Avaliar somente se a escala ou qualidade da busca justificar.

---

# 50. Analytics Architecture

Eventos do produto deverão possuir esquema consistente.

Exemplos:

```text
user_registered
marketplace_opened
merchant_viewed
product_viewed
service_viewed
checkout_started
payment_completed
cashback_earned
cashback_redeemed
review_created
post_created
recommendation_clicked
external_link_opened
parcel_registered
parcel_collected
```

Eventos não poderão armazenar PII desnecessária.

---

# 51. Performance Strategy

Aplicar:

- paginação;
- índices;
- lazy loading;
- cache seletivo;
- CDN quando necessário;
- compressão;
- otimização de imagens;
- limites de query.

Evitar otimização prematura que aumente complexidade sem evidência de gargalo.

---

# 52. Architectural Principles

## 52.1. Modular Monolith First

Começar simples.

```text
NestJS monolith
```

não significa:

```text
big ball of mud
```

Os módulos deverão possuir fronteiras claras.

---

## 52.2. PostgreSQL as Source of Truth

Dados permanentes e financeiros permanecem no PostgreSQL.

Redis não é fonte da verdade.

---

## 52.3. Financial Integrity First

Pagamento, cashback e revenue share têm precedência sobre conveniência arquitetural.

---

## 52.4. External Services Through Adapters

Evitar dependência forte de fornecedores.

Exemplos:

```text
PaymentGateway
StorageProvider
EmailProvider
PushProvider
MapsProvider
```

---

## 52.5. No Premature Microservices

Nenhum módulo deverá virar microserviço apenas por organização conceitual.

Separação física somente quando houver justificativa:

- escala;
- isolamento;
- disponibilidade;
- segurança;
- equipe;
- performance.

---

# 53. Self-Hosting Principles

O projeto deverá privilegiar:

- software open source;
- componentes leves;
- formatos e protocolos abertos;
- backups portáveis;
- ausência de vendor lock-in desnecessário.

Por esse motivo, **Supabase não integra a arquitetura principal do Life**.

Recursos equivalentes serão fornecidos diretamente por:

```text
Supabase PostgreSQL → PostgreSQL
Supabase Auth       → NestJS Auth
Supabase Storage    → MinIO/S3
Supabase Realtime   → NestJS WebSocket/SSE
Supabase Functions  → NestJS Workers
```

Isso reduz:

- consumo de recursos;
- quantidade de containers;
- complexidade;
- sobreposição funcional;
- dependência estrutural.

---

# 54. Scaling Strategy

## Estágio 1 — MVP

```text
Single host
+
Docker Compose
```

Componentes:

```text
Caddy
Next.js
NestJS
PostgreSQL
Redis
MinIO
```

---

## Estágio 2 — Crescimento

Separar:

```text
Application server
Database server
Object storage
Backup
```

Adicionar:

- réplicas;
- workers;
- proxy;
- CDN.

---

## Estágio 3 — Alta escala

Somente mediante necessidade:

```text
Load Balancer
      │
 ┌────┴────┐
 API      API
 │          │
 Workers  Workers
      │
 PostgreSQL HA
 Redis HA
 Object Storage Cluster
```

---

# 55. Future Considerations / Roadmap

Arquitetura deverá permitir evolução para:

- recommendation engine avançado;
- ML;
- antifraude dedicado;
- busca especializada;
- mensageria;
- analytics warehouse;
- múltiplas regiões;
- PostgreSQL HA;
- object storage distribuído;
- workers separados;
- serviços independentes.

---

# 56. Potential Future Service Extraction

Caso necessário, candidatos naturais:

```text
Payments
Notifications
Recommendations
Media Processing
Search
Analytics
```

Essa separação não faz parte do MVP.

---

# 57. Explicit Non-Goals

O MVP não deverá possuir:

- Kubernetes;
- service mesh;
- dezenas de microserviços;
- Kafka sem necessidade comprovada;
- Elasticsearch sem necessidade;
- banco separado por módulo;
- blockchain;
- arquitetura serverless fragmentada;
- Supabase self-hosted;
- sistemas duplicados de autenticação;
- mais de uma fonte de verdade financeira.

---

# 58. Architecture Decision Records

Decisões arquiteturais significativas deverão ser registradas em:

```text
docs/ADR/
```

Exemplos:

```text
ADR-001-monorepo.md
ADR-002-modular-monolith.md
ADR-003-postgresql.md
ADR-004-self-hosted.md
ADR-005-financial-ledger.md
ADR-006-payment-provider-abstraction.md
```

Cada ADR deverá registrar:

- contexto;
- decisão;
- alternativas;
- consequências;
- data.

---

# 59. Project Identification

**Project Name:** Life Super App

**Product Type:** Super App Condominial, Marketplace e Rede Social Local

**Repository:** A definir

**Architecture:** Monorepo + Modular Monolith

**Hosting:** Self-hosted

**Primary Language:** TypeScript

**Primary Database:** PostgreSQL

**Last Updated:** 2026-08-29

---

# 60. Technology Summary

| Camada | Tecnologia |
|---|---|
| Mobile | React Native + Expo |
| Mobile Routing | Expo Router |
| Web | Next.js |
| Backend | NestJS |
| Linguagem | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Cache | Redis |
| Queue | Redis-based |
| Storage | MinIO / S3-compatible |
| Realtime | NestJS WebSocket / SSE |
| Validation | Zod + DTO backend |
| API State | TanStack Query |
| Local State | Zustand |
| Web UI | Tailwind CSS + shadcn/ui |
| Infrastructure | Docker Compose |
| Reverse Proxy | Caddy |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana + logs |
| Error Monitoring | Sentry |
| Payments | PSP via adapter |
| Monorepo | pnpm + Turborepo |

---

# 61. Core Business Architecture

O núcleo econômico do Life deverá seguir:

```text
               CONDOMÍNIO
                   ▲
                   │
            revenue share
                   │
                   │
USUÁRIO ───────► LIFE ◄─────── EMPREENDEDOR
   │               │                ▲
   │               │                │
   │               ▼                │
   │           MARKETPLACE          │
   │               │                │
   │               ▼                │
   │            PAGAMENTO ──────────┘
   │               │
   │               ▼
   │            CASHBACK
   │               │
   └───────────────┘
          retorno

           +
     REDE SOCIAL
           │
           ▼
      AVALIAÇÕES
           │
           ▼
      REPUTAÇÃO
           │
           ▼
    RECOMENDAÇÕES
           │
           ▼
      NOVA COMPRA
```

---

# 62. Architectural Business Rule

A arquitetura do Life deverá preservar este ciclo:

```text
Uso
 ↓
Transação
 ↓
Pagamento
 ↓
Receita Life
 ├── Cashback
 └── Participação do condomínio
 ↓
Experiência
 ↓
Avaliação
 ↓
Reputação
 ↓
Recomendação
 ↓
Novo consumo
```

Marketplace, pagamentos, cashback, social, reputação, Insights e revenue share não deverão ser desenvolvidos como funcionalidades isoladas.

Eles constituem partes interdependentes do **núcleo econômico e social do Life**.

---

# 63. Final Architecture Statement

O **Life Super App** será construído inicialmente como uma plataforma self-hosted baseada em:

> **React Native + Expo + Next.js + NestJS + PostgreSQL + Redis + MinIO, executados em uma arquitetura monolítica modular e containerizada com Docker.**

A arquitetura deverá privilegiar:

- simplicidade operacional;
- segurança;
- integridade financeira;
- excelente UX;
- portabilidade;
- baixa dependência de fornecedores;
- eficiência de recursos;
- capacidade de auditoria;
- escalabilidade progressiva;
- manutenção de longo prazo.

A regra central é:

> **começar com uma arquitetura simples o suficiente para ser operável, mas estruturalmente correta o suficiente para crescer sem exigir a reconstrução do Life.**
