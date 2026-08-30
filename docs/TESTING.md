# Estratégia de testes

## Escopos cobertos

A suíte usa `node:test` e testa interfaces públicas, não detalhes internos:

- `prototype/finance.js`: regra financeira em centavos, limites, arredondamento e invariantes;
- `server.mjs`: endpoints HTTP, métodos, validação, JSON, payload máximo, concorrência, path traversal, fallback SPA e respostas de erro;
- `prototype/app.js`: renderização, navegação, persistência local corrompida, compra aprovada/rejeitada e escaping do feed;
- `prototype/sw.js`: ciclo install/activate, limpeza de cache, cache-first para GET e não interceptação de POST;
- `apps/mobile/src/storage/lifeState.js`: normalização pura do estado persistido mobile, usada como unidade testável da camada de storage.

## Executar

```bash
npm test
npm run test:coverage
```

O comando de cobertura usa o relatório nativo do Node:

```text
finance.js: 100% linhas, 100% branches, 100% funções
lifeState.js: 100% linhas, 100% branches, 100% funções
server.mjs: 93,86% linhas, 81,40% branches, 85,71% funções
Total dos arquivos instrumentados: 95,98% linhas, 88,57% branches, 91,67% funções
```

Esses números são do último run verificado localmente e podem mudar quando o código evoluir. O CI deve executar o comando novamente, não confiar nesses valores documentados.

## Qualidade da suíte

- Casos de sucesso e falha estão presentes.
- Valores monetários são verificados em centavos para evitar falsos negativos por ponto flutuante.
- A API é testada via HTTP real contra uma porta efêmera.
- O teste concorrente valida que respostas independentes não se corrompem.
- O frontend é executado em um harness de DOM mínimo; o teste observa o markup e o estado persistido, sem testar funções privadas diretamente.
- O Service Worker é executado em um mock do `ServiceWorkerGlobalScope`.

## Lacunas conhecidas

- `apps/mobile/App.tsx` ainda não possui testes de componente em React Native.
- `lifeStorage.ts` não é executado no runtime Expo nesta suíte; sua lógica de normalização foi extraída para `lifeState.js` e testada separadamente.
- Não há E2E em navegador real, teste de acessibilidade automatizado, carga/performance ou mutation testing.
- O protótipo não possui backend persistente, autenticação ou pagamento real; esses testes só devem ser adicionados quando essas interfaces existirem.

## Próximos testes recomendados

1. Adicionar testes de componente com React Native Testing Library quando o workspace mobile estiver instalável no CI.
2. Adicionar Playwright para validar o fluxo visual real em Chromium.
3. Adicionar testes de contrato entre cliente mobile e API.
4. Adicionar testes de autenticação, autorização e isolamento de sessão na branch de hardening.
5. Adicionar testes de carga para limites de rate e timeout quando houver ambiente de CI apropriado.
