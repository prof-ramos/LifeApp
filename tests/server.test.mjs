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

test('rota estática inexistente serve index.html como fallback (SPA)', async () => {
  const response = await fetch(`${baseUrl}/does-not-exist.js`);
  assert.equal(response.status, 200);
  const text = await response.text();
  assert.ok(text.includes('<!doctype html>'), 'should contain HTML doctype');
});
