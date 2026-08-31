import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';

let server;
let baseUrl;

test.before(async () => {
  server = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('health check responde apenas no método GET', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.status, 'ok');
  assert.equal(payload.service, 'life-mvp');
  assert.equal(typeof payload.time, 'string');
});

test('checkout quote rejeita tipos inválidos sem coerção silenciosa', async () => {
  const response = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({gross: '100', cashbackRate: 0.04}),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: {code: 'INVALID_MONEY', message: 'Não foi possível processar a solicitação.'},
  });
});

test('POST em health check e GET em quote retornam 405', async () => {
  const health = await fetch(`${baseUrl}/api/health`, {method: 'POST'});
  assert.equal(health.status, 405);

  const quote = await fetch(`${baseUrl}/api/checkout/quote`);
  assert.equal(quote.status, 405);
});

test('checkout quote calcula uma cotação válida', async () => {
  const response = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({gross: 100, cashbackRate: 0.04}),
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.provider, 'mock');
  assert.equal(payload.currency, 'BRL');
  assert.equal(payload.allocation.condominiumShare, 0.85);
});

test('checkout quote calcula resgate no limite e cashback sobre o valor pago', async () => {
  const response = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({gross: 100, cashbackUsed: 50, cashbackRate: 0.1}),
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.allocation.cashbackUsed, 50);
  assert.equal(payload.allocation.customerPayable, 50);
  assert.equal(payload.allocation.cashbackEarned, 5);
});

test('POST direto não contorna o teto de 50% do cashback', async () => {
  const response = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({gross: 100, cashbackUsed: 50.01}),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'CASHBACK_LIMIT_EXCEEDED');
});

test('quote rejeita JSON inválido, taxas inválidas e dinheiro negativo', async () => {
  const cases = [
    {body: '{not-json', code: 'INVALID_JSON'},
    {body: JSON.stringify({gross: 100, cashbackRate: -0.01}), code: 'INVALID_RATE'},
    {body: JSON.stringify({gross: -1}), code: 'INVALID_MONEY'},
  ];

  for (const {body, code} of cases) {
    const response = await fetch(`${baseUrl}/api/checkout/quote`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body,
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, code);
  }
});

test('quote rejeita payload maior que 64 KB', async () => {
  const response = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({gross: 1, padding: 'x'.repeat(64_000)}),
  });
  assert.equal(response.status, 413);
});

test('processa requisições válidas concorrentes sem corromper a resposta', async () => {
  const responses = await Promise.all(Array.from({length: 20}, () => fetch(`${baseUrl}/api/checkout/quote`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({gross: 79.9, cashbackRate: 0.1}),
  })));

  assert.ok(responses.every(response => response.status === 200));
  const payloads = await Promise.all(responses.map(response => response.json()));
  assert.ok(payloads.every(payload => payload.allocation.condominiumShare === 0.2));
});

test('rota API desconhecida retorna 404 em JSON', async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: {code: 'NOT_FOUND', message: 'Não encontrado.'},
  });
});

test('URL percent-encoded com traversal não escapa do diretório público', async () => {
  const response = await fetch(`${baseUrl}/%2e%2e%2fpackage.json`);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Life Super App/);
});

test('rota estática inexistente serve index.html como fallback (SPA)', async () => {
  const response = await fetch(`${baseUrl}/does-not-exist.js`);
  assert.equal(response.status, 200);
  const text = await response.text();
  assert.ok(text.includes('<!doctype html>'), 'should contain HTML doctype');
});

test('documentos jurídicos versionados ficam acessíveis antes do aceite', async () => {
  const paths = [
    '/legal/terms-2026-08-30.html',
    '/legal/privacy-2026-08-30.html',
  ];
  const responses = await Promise.all(paths.map(path => fetch(`${baseUrl}${path}`)));
  assert.ok(responses.every(response => response.status === 200));
  const texts = await Promise.all(responses.map(response => response.text()));
  assert.match(texts[0], /Termos de Uso/);
  assert.match(texts[0], /2026-08-30/);
  assert.match(texts[1], /Política de Privacidade/);
  assert.match(texts[1], /2026-08-30/);
});
