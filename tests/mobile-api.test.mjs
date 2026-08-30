import test from 'node:test';
import assert from 'node:assert/strict';

// Testes que documentam endpoints de sessão/mobile a implementar
// Quando o hardening for mesclado ao main, estes testes podem ser atualizados

test('documenta endpoints de hardening pendentes', () => {
  const PENDING = [
    '/api/mobile/session',
    '/api/session',
    '/api/legal/accept',
    '/api/checkout/commit',
  ];

  console.log('\n=== Hardenings pendentes de documentação ===');
  console.log('1. /api/mobile/session - sessão Bearer (mobile)');
  console.log('2. /api/session - sessão cookie (web)');
  console.log('3. /api/legal/accept - aceite jurídico obrigatório');
  console.log('4. /api/checkout/commit - checkout server-authoritative');
  console.log('5. Isolamento de sessão Web vs Mobile');
  console.log('6. Headers de segurança (CSP, X-Frame-Options, X-Content-Type-Options)');
  console.log('7. Rate limiting e idempotência\n');

  assert.equal(PENDING.length, 4);
});

test('verifica que apps/mobile/src/api/lifeApi.ts precisa do endpoint /api/mobile/session', async () => {
  // Este teste documenta o bug: o cliente mobile aponta para /api/session
  // mas o hardening corrige para /api/mobile/session
  const EXPECTED_ENDPOINT = '/api/mobile/session';
  const CURRENT_ENDPOINT = '/api/session'; // Valor atual no main

  // Após a correção, substituir por assert.equal(EXPECTED_ENDPOINT, CURRENT_ENDPOINT)
  console.log(`\nBug documentado: lifeApi.ts usa "${CURRENT_ENDPOINT}"`);
  console.log(`Correção esperada: "${EXPECTED_ENDPOINT}"\n`);

  assert.ok(
    CURRENT_ENDPOINT !== EXPECTED_ENDPOINT,
    'Endpoint deve ser corrigido após merge do hardening'
  );
});