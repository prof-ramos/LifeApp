# Life Super App — MVP 0.1

MVP funcional de validação do Life, orientado aos fluxos críticos do PRD.

## O que já funciona no protótipo

- onboarding com aceite de documentos legais (registro no servidor demonstrativo);
- Home personalizada do morador;
- área condominial com encomenda e convite de visitante;
- marketplace com lojas, produtos/serviços e perfil do anunciante;
- checkout obrigatório dentro do Life;
- pagamento **simulado** (não movimenta dinheiro real);
- uso e geração de cashback;
- cálculo demonstrável de receita Life;
- cálculo de 10% de revenue share do condomínio sobre a receita elegível do Life;
- ledger demonstrativo por transação;
- Life Wallet;
- comunidade/feed com avaliações verificadas;
- criação de publicação;
- Insights com gráficos, gastos, economia e recomendação de uso de cashback;
- Explorar com links externos claramente identificados;
- visão do empreendedor;
- visão de gestão do condomínio;
- sessão web por cookie HttpOnly e sessão mobile por token no `SecureStore`;
- PWA com service worker básico.

## Executar agora

Requisito: Node.js >= 20.19.

```bash
npm run dev
```

Abra `http://localhost:4173`.

Não há dependências npm para o protótipo web, portanto ele inicia imediatamente.

## Testar o fluxo econômico

1. Aceite os termos demonstrativos no primeiro acesso.
2. Abra **Comprar**.
3. Entre em uma loja ou escolha um produto/serviço.
4. Clique em **Comprar no Life**.
5. Defina quanto do cashback deseja usar.
6. Confirme o pagamento simulado.
7. Confira no recibo valor bruto, recebível do empreendedor, taxa PSP simulada, cashback, receita Life elegível, 10% do condomínio e receita líquida Life.
8. Abra **Perfil > Life Wallet** para conferir o novo saldo.
9. Troque para **Gestão condomínio** para visualizar a participação acumulada.

## Importante

Este pacote é um MVP de produto/UX e de regras de negócio demonstrativas. Ele **não é produção**.

Antes de operação real, ainda devem ser implementados no backend: PostgreSQL como fonte da verdade; autenticação e autorização RBAC/contextual; API NestJS; ledger financeiro persistente e auditável; integração real com PSP e webhooks assinados; conciliação, estorno, disputa e settlement; storage S3-compatible; logs de auditoria; notificações push; moderação; direitos LGPD; backups e restore testado.

Nenhum pagamento real foi implementado porque isso exige credenciais, contrato e definição do PSP. O MVP usa um adapter conceitual e valores simulados apenas para validar a experiência e a regra econômica.

## Stack alvo de produção

- Mobile: React Native + Expo SDK 57
- Web: Next.js 16.3.x
- API: NestJS + TypeScript
- Banco: PostgreSQL
- Cache/filas: Redis
- Storage: S3-compatible
- Infra: Docker Compose + Caddy
- Arquitetura: monólito modular self-hosted

Veja `docs/MVP-STATUS.md`.

## Shell nativo Expo

O pacote contém `apps/mobile`, com uma implementação Expo SDK 57 do núcleo visual para iOS/Android.

## Sessão e persistência demonstrativas

O protótipo web usa um cookie `HttpOnly` e o shell Expo guarda somente o token de sessão no `expo-secure-store`. O estado financeiro demonstrativo, o aceite jurídico e a idempotência ficam no servidor em memória; reiniciar o processo descarta essas sessões. Essa implementação prova o contrato e não substitui PostgreSQL, autenticação de produção ou um ledger persistente.

```bash
cd apps/mobile
npx expo install expo-secure-store
```
