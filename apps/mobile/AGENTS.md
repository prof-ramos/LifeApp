# Mobile — Expo SDK 57 Shell

## OVERVIEW
React Native + Expo SDK 57 mobile app. Single-file prototype with simplified business logic.

## STRUCTURE
```
apps/mobile/
├── App.tsx        # Single-file app: all views, state, logic
├── app.json       # Expo config (slug: life-super-app, dark theme)
├── package.json   # Expo ~57, React 19.2.3, RN 0.86.0
└── app/           # Empty (placeholder for Expo Router)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| All views/logic | App.tsx | Single-file monolith (similar to prototype/app.js) |
| Buy/payment flow | App.tsx:buy() | Simplified cashback calc (no fees/condo share) |
| Navigation | App.tsx | Tab-based: Home, Market, Social, Insights, Profile |
| Theme | App.tsx:s | Dark theme object (colors, spacing) |
| Seed data | App.tsx | Merchants array duplicated from prototype/app.js |

## CONVENTIONS
- **Single file**: All code in `App.tsx` (no src/, no routes, no components/)
- **Implicit entry**: `package.json` main → `expo/AppEntry` (no index.ts owned)
- **Portuguese**: UI text, error messages
- **English**: code identifiers (camelCase), error codes (UPPER_SNAKE)
- **Dark theme**: Default and only theme (portrait lock)

## ANTI-PATTERNS
- `buy()` in App.tsx DUPLICATES `calculateAllocation()` from prototype/finance.js
- Mobile version SIMPLIFIES: no platformFee, no pspFee, no condoShare
- **Keep in sync manually** when economic rules change in finance.js

## API INTEGRATION
- Currently standalone (no server calls)
- Prototype fetches from `http://localhost:4173/api/checkout/quote`
- Mobile does NOT call the API — all logic is client-side

## COMMANDS
```bash
cd apps/mobile
npm start        # Expo dev server
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web (Metro bundler)
```

## NOTES
- **No tests**: No test script, no jest config
- **No tsconfig**: Uses Expo defaults
- **No workspace linkage**: Root package.json has no `workspaces` field
- **Empty app/ dir**: Placeholder for future Expo Router migration
