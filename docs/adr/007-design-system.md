# ADR-007 — Life Design System

**Status:** Accepted
**Date:** 2026-08-30

## Context

O Life precisa entregar uma identidade consistente em Web, iOS e Android sem forçar compartilhamento de componentes incompatíveis entre DOM e React Native. O produto também exige baixo vendor lock-in e liberdade para criar componentes próprios de marketplace, cashback, comunidade e condomínio.

## Decision

Adotar uma arquitetura de design em três camadas:

1. **Tokens compartilhados** em `packages/design-tokens` como fonte comum de cores semânticas, radius e spacing.
2. **Primitives por plataforma**:
   - Web: Next.js + shadcn/ui conventions + Tailwind CSS;
   - Mobile: Expo + React Native Reusables conventions + NativeWind stable.
3. **Life Components** compostos sobre os primitives, como `WalletCard`, `CashbackBadge` e `MerchantCard`.

Não compartilhar componentes DOM/React Native à força. Compartilhar tokens, nomenclatura, contratos e regras de produto.

## Product design principles

- aparência social, humana e premium; nunca ERP;
- uma ação principal clara por card/tela;
- cashback deve parecer benefício, não saldo bancário;
- dados condominiais privados por padrão;
- navegação mobile com até cinco destinos primários;
- touch targets com pelo menos 44px;
- contraste e foco visível;
- estados de loading, disabled, erro e vazio fazem parte do componente;
- verde Life representa ação/benefício, não decoração indiscriminada.

## Semantic tokens

Os componentes devem consumir nomes como `primary`, `surface`, `muted`, `border`, `destructive` e `success`. Valores hexadecimais não devem ser espalhados por feature screens.

## Consequences

- código de primitives permanece sob controle do repositório;
- Web e Mobile podem evoluir respeitando convenções nativas;
- alterações de identidade começam pelos tokens;
- novos componentes de negócio devem nascer em `components/life`, não duplicados em telas;
- o CLI do shadcn e o CLI do React Native Reusables podem ser usados para incorporar novos primitives, sempre revisando o código gerado antes do commit.
