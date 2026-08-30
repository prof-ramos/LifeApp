# Prototype — Life Super App Web MVP

## OVERVIEW
Vanilla JS single-page application validating core business flows. Zero dependencies, no build step.

## STRUCTURE
```
prototype/
├── app.js            # 67-line monolith: state, routing, 10+ views, modals
├── finance.js        # Pure business logic: calculateAllocation (cashback, fees, revenue share)
├── index.html        # Entry point, loads app.js as module
├── styles.css        # Dark theme styles
├── sw.js             # PWA service worker (caches app shell)
├── manifest.webmanifest  # PWA manifest
└── assets/           # Empty (placeholder)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Cashback/fees/revenue calculation | finance.js | `calculateAllocation()` — pure function, testable |
| UI views and routing | app.js | `render()` → shell → pages (home/market/social/insights/profile) |
| Payment flow | app.js:completePayment | Calls `/api/checkout/quote` via fetch |
| Modal dialogs | app.js:renderModal | legalModal, wrapModal |
| Global state | app.js:state | localStorage persistence (`life-mvp-state`) |
| API integration | app.js | `fetch('/api/checkout/quote')` for quote calculation |

## CONVENTIONS
- **Zero imports**: app.js has no import statements; all code is inline
- **Global functions**: exposed on `window` for DOM event handlers
- **Compact style**: 2-space indent, single quotes, semicolons, no spaces around `=`/`=>`/`:`
- **Portuguese**: UI text, error messages, test descriptions
- **English**: code identifiers (camelCase), error codes (UPPER_SNAKE)

## ANTI-PATTERNS
- `finance.js` is the SINGLE SOURCE OF TRUTH for economic rules
- `app.js` does NOT import `finance.js` — it calls the server via fetch
- `apps/mobile/App.tsx` DUPLICATES a simplified version (no fees/condo share) — keep in sync manually

## API CONTRACT
```
POST /api/checkout/quote
Request:  { gross: number, cashbackRate?: number }
Response: { allocation: {...}, provider: 'mock', currency: 'BRL' }

GET /api/health
Response: { status: 'ok', service: 'life-mvp', time: string }
```

## NOTES
- Server serves from `process.cwd()/prototype/` — run `npm run dev` from repo root
- `app.js` is DOM-bound, not importable — test `finance.js` directly instead
- Seed data (merchants, products) is hardcoded in `app.js`
