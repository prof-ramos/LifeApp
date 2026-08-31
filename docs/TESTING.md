# Estratégia de testes

## Escopos cobertos

A suíte usa `node:test` e testa interfaces públicas, não detalhes internos:

- `prototype/finance.js`: regra financeira em centavos, limites, arredondamento e invariantes;
- `server.mjs`: endpoints HTTP, métodos, validação, JSON, payload máximo, concorrência, path traversal, fallback SPA, sessões por canal, aceite jurídico, catálogo autoritativo, checkout e idempotência;
- `prototype/app.js`: contrato web com sessão do servidor, catálogo autoritativo e ausência de autoridade financeira em `localStorage`;
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
- O contrato web é validado contra uma API HTTP real em porta efêmera; o shell não guarda estado financeiro em `localStorage`.
- O Service Worker é executado em um mock do `ServiceWorkerGlobalScope`.

## Lacunas conhecidas

- `apps/mobile/App.tsx` ainda não possui testes de componente em React Native nem smoke test em Expo Go.
- `lifeStorage.ts` não é executado no runtime Expo nesta suíte; sua lógica de normalização foi extraída para `lifeState.js` e testada separadamente.
- `lifeApi.ts` não é executado em dispositivo real nesta suíte; o contrato do servidor é coberto por HTTP e o typecheck/export validam o empacotamento.
- Não há E2E em navegador ou dispositivo real, teste de acessibilidade automatizado, carga/performance ou mutation testing.
- O protótipo ainda não possui backend persistente, identidade real ou pagamento real.

## Próximos testes recomendados

1. Adicionar testes de componente com React Native Testing Library quando o workspace mobile estiver instalável no CI.
2. Adicionar Playwright para validar o fluxo visual real em Chromium.
3. Adicionar testes de componente com React Native Testing Library para o gate jurídico e o checkout.
4. Adicionar smoke test em dispositivo/Expo Go com `SecureStore` e `EXPO_PUBLIC_API_URL`.
5. Adicionar testes de carga para limites de rate e timeout quando houver ambiente de CI apropriado.

## Nota sobre a sessão mobile

O shell mobile usa `/api/mobile/session`, guarda o bearer no `SecureStore` e envia esse token para aceite jurídico e checkout. O servidor rejeita o uso cruzado de cookie web e bearer mobile. A validação em dispositivo real continua pendente.
