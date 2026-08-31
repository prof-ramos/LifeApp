# MVP Status

## Implementado e testável agora

| Domínio | Estado | Observação |
|---|---|---|
| Home | Funcional | Conteúdo contextual demonstrativo |
| Condomínio | Parcial funcional | Encomenda e visitante demonstrados |
| Marketplace consumidor | Funcional | Lojas, produtos/serviços e checkout |
| Visão do empreendedor | Funcional | Dashboard demonstrativo |
| Pagamento | Simulado | Nenhuma transação financeira real |
| Cashback | Funcional | Emissão e saldo demonstrativo |
| Revenue share | Funcional | 10% sobre receita Life elegível |
| Ledger | Regra demonstrativa | Persistência central pendente |
| Rede social | Funcional | Feed e avaliação verificada demonstrativa |
| Insights | Funcional | Gastos e recomendação de cashback |
| Explorar | Funcional | Link externo identificado |
| Gestão condomínio | Funcional demonstrativo | Dashboard e participação financeira |
| PWA | Funcional | Manifest + service worker básico |
| iOS/Android | MVP Expo | Shell React Native implementado |
| Sessão web/mobile | Parcial funcional | Cookie web e bearer mobile; estado demonstrativo em memória |
| SecureStore mobile | Funcional | Guarda somente o token da sessão demonstrativa |
| PostgreSQL | Infra definida | Fonte da verdade futura para backend |

## Sessão e persistência demonstrativas

- Web usa cookie `HttpOnly`, `SameSite=Strict`; mobile usa bearer token guardado no `expo-secure-store`.
- O servidor mantém sessão, aceite, saldo, pedidos e idempotência em `Map` process-local apenas para demonstrar o contrato.
- Reiniciar o processo descarta o estado demonstrativo; PostgreSQL permanece como autoridade futura para dados centrais e financeiros.
- Nenhum saldo local ou token demonstrativo deve autorizar movimentação financeira real sem validação do backend.

## Critério para beta operacional

O Life só deve operar com dinheiro real quando pagamento, ledger, autenticação, autorização, auditoria, conciliação, LGPD operacional, webhooks e backups estiverem implementados no backend e testados.
