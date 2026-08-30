# Security Policy — Life

## Status da base

Este repositório contém um MVP e um servidor de demonstração. `server.mjs` é deliberadamente bloqueado quando `NODE_ENV=production` e aceita somente `PAYMENT_PROVIDER=mock`.

O backend de produção deverá ser o serviço NestJS/PostgreSQL descrito na arquitetura do projeto. Nenhum controle implementado apenas no protótipo deve ser interpretado como autenticação financeira de produção.

## Fronteiras de confiança

- O cliente nunca define preço, taxa de cashback, comissão, saldo ou revenue share.
- Valores monetários são representados em centavos inteiros nas regras financeiras do MVP.
- SQLite/localStorage são cache/estado de apresentação e nunca fonte de verdade para dinheiro, papel de usuário ou aceite legal.
- Tokens mobile ficam em SecureStore/Keychain/Keystore.
- Toda mutação financeira deve ser autenticada, autorizada, idempotente e transacional no backend de produção.
- O contexto de condomínio deve ser derivado da sessão/membership no servidor; nunca confiar em `condominiumId` arbitrário vindo do cliente.
- O ledger de produção deve ser imutável por reversões compensatórias, auditável e reconciliável.

## Política de dependências

- Dependências diretas são fixadas por versão e o repositório mantém `pnpm-lock.yaml`.
- CI instala com `--frozen-lockfile` e bloqueia vulnerabilidades `high`/`critical` via `pnpm audit`.
- GitHub Actions são fixadas por SHA.
- `postcss` é forçado para `8.5.18` ou superior corrigido através de override central.
- O upstream `image-size` foi arquivado sem publicar correção para CVE-2025-71329/CVE-2025-71330. O grafo transitivo do Expo/Metro é substituído pelo drop-in `image-size-next@2.1.1`, fixado por versão e lockfile. Remover esse override quando o toolchain oficial deixar de depender do pacote vulnerável.

## Requisitos antes de produção

1. Substituir a sessão anônima em memória do demo por autenticação real no NestJS.
2. Implementar RBAC + autorização contextual/multi-tenant no servidor.
3. Persistir usuários, memberships, aceitações legais, pedidos, pagamentos, cashback e ledger no PostgreSQL.
4. Integrar PSP por adaptador, validar assinatura de webhook e deduplicar eventos.
5. Usar idempotency keys persistentes para pagamentos e operações financeiras.
6. Manter PostgreSQL, Redis e console administrativo do object storage em rede privada.
7. Usar credenciais de aplicação com menor privilégio; credenciais root apenas para administração.
8. Executar CI de segurança e backups/restores testados antes de liberar dados reais.

## Segredos

Nunca commitar `.env`, chaves privadas, certificados de cliente, tokens, credenciais de PSP, credenciais de banco ou credenciais de object storage. Os arquivos `*.example` devem conter somente placeholders.

## Relato de vulnerabilidades

Não publique detalhes exploráveis em issue pública. Use um canal privado do mantenedor/GitHub Security Advisories quando habilitado no repositório.
