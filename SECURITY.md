# Política de Segurança — Life

## Status da base

Este repositório contém um MVP e um servidor de demonstração. O protótipo não é uma base de autenticação, autorização ou processamento financeiro de produção.

O backend de produção deverá ser o serviço NestJS/PostgreSQL descrito na arquitetura do projeto. Nenhum controle implementado apenas no protótipo deve ser interpretado como proteção suficiente para dados ou dinheiro reais.

## Fronteiras de confiança

- O cliente nunca define preço, taxa de cashback, comissão, saldo ou revenue share.
- Valores monetários são representados em centavos inteiros nas regras financeiras do MVP.
- SQLite/localStorage são estado demonstrativo e nunca fonte de verdade para dinheiro, papel de usuário ou aceite legal.
- O contexto de condomínio deve ser derivado da sessão/membership no servidor; nunca confiar em `condominiumId` arbitrário vindo do cliente.
- Toda mutação financeira real deve ser autenticada, autorizada, idempotente e transacional no backend.
- O ledger de produção deve ser imutável por reversões compensatórias, auditável e reconciliável.

## Política de dependências e CI

- O repositório mantém `package-lock.json` para o gate npm raiz e `pnpm-lock.yaml` para o workspace Web/Mobile; cada pipeline usa o lockfile correspondente.
- Dependências do workspace são instaladas com `pnpm install --frozen-lockfile`.
- O `Security CI` bloqueia vulnerabilidades high e critical via `pnpm audit --audit-level high`. Vulnerabilidades moderate não são gate de merge neste MVP e devem ser acompanhadas por alertas de segurança/Dependabot ou por exceção documentada.
- GitHub Actions usadas no CI são fixadas por SHA; atualizações devem ser revisadas antes de alterar os pins.
- Dependências, lockfiles e workflows devem ser atualizados por PR revisável, com testes e builds reproduzíveis.

## Requisitos antes de produção

1. Substituir qualquer sessão demonstrativa em memória por autenticação real no NestJS.
2. Implementar RBAC e autorização contextual/multi-tenant no servidor.
3. Persistir usuários, memberships, aceitações legais, pedidos, pagamentos, cashback e ledger no PostgreSQL.
4. Integrar PSP por adaptador, validar assinatura de webhook e deduplicar eventos.
5. Usar idempotency keys persistentes para pagamentos e operações financeiras.
6. Manter PostgreSQL, Redis e object storage em rede privada, com credenciais de menor privilégio.
7. Executar CI de segurança e backups/restores testados antes de liberar dados reais.

## Segredos

Nunca commitar `.env`, chaves privadas, certificados de cliente, tokens, credenciais de PSP, credenciais de banco ou credenciais de object storage. Arquivos `*.example` devem conter somente placeholders.

## Relato de vulnerabilidades

Não publique detalhes exploráveis em issue pública. Use um canal privado do mantenedor ou GitHub Security Advisories quando habilitado no repositório.
