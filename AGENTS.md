# PROJECT KNOWLEDGE BASE

**Generated:** 2026-08-30
**Branch:** main

## OVERVIEW
Life Super App MVP 0.1 — vanilla JS prototype validating core business flows (marketplace, cashback, revenue share, ledger) with a planned NestJS + Next.js + Expo production stack.

## STRUCTURE
```
LifeApp/
├── prototype/    # Vanilla JS SPA (app.js, finance.js, index.html)
├── apps/
│   ├── mobile/   # Expo SDK 57 mobile shell
│   └── api/      # Empty NestJS stub
├── docs/         # ARCHITECTURE.md, PRD.md, MVP-STATUS.md
├── tests/        # finance.test.mjs (node:test)
├── server.mjs    # Dev server (node:http)
└── compose.yml   # Postgres/Redis/Minio infra
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Business logic | prototype/finance.js | calculateAllocation — cashback, fees, revenue share |
| Frontend UI | prototype/app.js | 67-line monolith, DOM-bound, no imports |
| HTTP server | server.mjs | Serves prototype/ + /api/checkout/quote |
| Mobile app | apps/mobile/App.tsx | Expo SDK 57, single-file shell |
| Tests | tests/finance.test.mjs | node:test, 2 tests for finance.js |
| Architecture | docs/ARCHITECTURE.md | Target stack, constraints, ADRs |
| PRD | docs/PRD.md | Product requirements |
| MVP status | docs/MVP-STATUS.md | What's implemented |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| calculateAllocation | function | prototype/finance.js | server.mjs, tests | Core economic rules |
| server | http.Server | server.mjs | — | Dev server + API |
| App | component | apps/mobile/App.tsx | — | Mobile entry |

## CONVENTIONS
- ESM everywhere (`"type": "module"`)
- Node >= 20.19
- Tests: `node --test tests/*.test.mjs`
- Compact style: 2-space indent, single quotes, semicolons
- Portuguese in docs/comments, English in code identifiers
- Error codes: UPPER_SNAKE (`INVALID_GROSS`)

## ANTI-PATTERNS (THIS PROJECT)
- Never store full card data (PAN/CVV) — use PSP tokenization
- Never trust frontend-sent `condominiumId` without backend validation
- Never persist gross/net revenue as independent ledger entries
- Secrets never in Git/Docker/frontend/logs
- Backend never trusts client-only validation

## UNIQUE STYLES
- Zero-dependency web prototype (no npm install needed)
- Finance rules extracted as pure module (finance.js) for testability
- Business logic duplicated in mobile (simplified, no fees/condo share)

## COMMANDS
```bash
npm run dev        # Start dev server (localhost:4173)
npm test           # Run tests (2 tests, node:test)
cd apps/mobile && npm start  # Expo dev server
```

## NOTES
- `prototype/` is the served app, not an experiments directory
- README references `cd life-mvp` but directory is `prototype/` (stale)
- `apps/api/` is empty — no NestJS code yet
- compose.yml has infra but nothing uses it yet
- Only 5 files committed (AGENTS.md, README.md, docs/agents/*)
