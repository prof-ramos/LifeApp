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
| SQLite mobile | Funcional | `expo-sqlite/kv-store` para estado local |
| PostgreSQL | Infra definida | Fonte da verdade futura para backend |

## Persistência mobile

- SQLite local via `expo-sqlite/kv-store`.
- Cashback demonstrativo e quantidade de pedidos persistem entre reinicializações.
- PostgreSQL permanece como autoridade para dados centrais e financeiros.
- Nenhum saldo local deve autorizar movimentação financeira real sem validação do backend.

## Critério para beta operacional

O Life só deve operar com dinheiro real quando pagamento, ledger, autenticação, autorização, auditoria, conciliação, LGPD operacional, webhooks e backups estiverem implementados no backend e testados.
