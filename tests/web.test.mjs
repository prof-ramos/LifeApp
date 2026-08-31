import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createApp} from '../server.mjs';

const appSource = await fs.readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
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

const jsonRequest = async (path, {method = 'GET', headers = {}, body} = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {...(body === undefined ? {} : {'content-type': 'application/json'}), ...headers},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {response, payload: await response.json().catch(() => ({}))};
};

const cookieFrom = response => response.headers.get('set-cookie')?.split(';', 1)[0];

test('shell web usa sessão do servidor e catálogo autoritativo', async () => {
  assert.match(appSource, /\/api\/session/);
  assert.match(appSource, /\/api\/catalog/);
  assert.match(appSource, /\/api\/checkout\/commit/);
  assert.match(appSource, /textContent/);
  assert.doesNotMatch(appSource, /life-state/);

  const session = await jsonRequest('/api/session');
  const cookie = cookieFrom(session.response);
  assert.ok(cookie);
  assert.equal(session.payload.session.cashbackCents, 2780);
  const catalog = await jsonRequest('/api/catalog');
  assert.equal(catalog.payload.products.length, 3);
  assert.deepEqual(catalog.payload.products.map(product => product.id), ['cesta-fresh', 'corte-premium', 'visita-tecnica']);
});

test('fluxo web exige os dois documentos antes do checkout', async () => {
  const session = await jsonRequest('/api/session');
  const cookie = cookieFrom(session.response);
  const headers = {cookie, origin: baseUrl, 'idempotency-key': 'web-flow-checkout-key-01'};

  const beforeConsent = await jsonRequest('/api/checkout/commit', {method: 'POST', headers, body: {productId: 'cesta-fresh', useCashback: false}});
  assert.equal(beforeConsent.response.status, 403);
  assert.equal(beforeConsent.payload.error.code, 'LEGAL_ACCEPTANCE_REQUIRED');

  const accepted = await jsonRequest('/api/legal/accept', {method: 'POST', headers: {cookie, origin: baseUrl}, body: {version: '2026-08-30'}});
  assert.equal(accepted.response.status, 200);
  assert.equal(accepted.payload.session.legalAcceptedVersion, '2026-08-30');

  const checkout = await jsonRequest('/api/checkout/commit', {method: 'POST', headers, body: {productId: 'cesta-fresh', useCashback: false}});
  assert.equal(checkout.response.status, 200);
  assert.equal(checkout.payload.allocation.grossCents, 6490);
  assert.equal(checkout.payload.session.orders, 1);
});

test('documentos jurídicos continuam públicos e versionados', async () => {
  const paths = ['/legal/terms-2026-08-30.html', '/legal/privacy-2026-08-30.html'];
  const responses = await Promise.all(paths.map(path => fetch(`${baseUrl}${path}`)));
  assert.ok(responses.every(response => response.status === 200));
  const texts = await Promise.all(responses.map(response => response.text()));
  assert.match(texts[0], /Termos de Uso/);
  assert.match(texts[0], /2026-08-30/);
  assert.match(texts[1], /Política de Privacidade/);
  assert.match(texts[1], /2026-08-30/);
});

test('falha de checkout não altera o snapshot da sessão', async () => {
  const session = await jsonRequest('/api/session');
  const cookie = cookieFrom(session.response);
  const headers = {cookie, origin: baseUrl, 'idempotency-key': 'web-failure-checkout-key-01'};
  await jsonRequest('/api/legal/accept', {method: 'POST', headers: {cookie, origin: baseUrl}, body: {version: '2026-08-30'}});
  const invalid = await jsonRequest('/api/checkout/commit', {method: 'POST', headers, body: {productId: 'not-in-catalog', useCashback: false}});
  assert.equal(invalid.response.status, 404);
  const snapshot = await jsonRequest('/api/session', {headers: {cookie}});
  assert.equal(snapshot.payload.session.orders, 0);
  assert.equal(snapshot.payload.session.cashbackCents, 2780);
});
