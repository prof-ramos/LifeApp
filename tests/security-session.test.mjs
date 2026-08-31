import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.mjs';

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

const createWebSession = async () => {
  const result = await jsonRequest('/api/session');
  assert.equal(result.response.status, 200);
  const cookie = cookieFrom(result.response);
  assert.ok(cookie);
  return {cookie, session: result.payload.session};
};

const createMobileSession = async () => {
  const result = await jsonRequest('/api/mobile/session');
  assert.equal(result.response.status, 200);
  assert.equal(result.response.headers.get('set-cookie'), null);
  assert.match(result.payload.sessionToken, /^[0-9a-f-]{36}$/);
  return {token: result.payload.sessionToken, session: result.payload.session};
};

const acceptWebLegal = async cookie => jsonRequest('/api/legal/accept', {
  method: 'POST',
  headers: {cookie, origin: baseUrl},
  body: {version: '2026-08-30'},
});

const acceptMobileLegal = async token => jsonRequest('/api/legal/accept', {
  method: 'POST',
  headers: {authorization: `Bearer ${token}`},
  body: {version: '2026-08-30'},
});

test('aplica headers de segurança e não expõe o token na sessão web', async () => {
  const {response, payload} = await jsonRequest('/api/session');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(payload.sessionToken, undefined);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.match(response.headers.get('set-cookie'), /SameSite=Strict/);
});

test('mantém sessões web e mobile isoladas por canal', async () => {
  const web = await createWebSession();
  const mobile = await createMobileSession();

  const mobileWithWebCookie = await jsonRequest('/api/mobile/session', {headers: {cookie: web.cookie}});
  assert.equal(mobileWithWebCookie.response.status, 400);
  assert.equal(mobileWithWebCookie.payload.error.code, 'USE_WEB_SESSION_ENDPOINT');

  const webWithMobileBearer = await jsonRequest('/api/session', {headers: {authorization: `Bearer ${mobile.token}`}});
  assert.equal(webWithMobileBearer.response.status, 400);
  assert.equal(webWithMobileBearer.payload.error.code, 'USE_MOBILE_SESSION_ENDPOINT');

  const mobileWithWebBearer = await jsonRequest('/api/mobile/session', {headers: {authorization: `Bearer ${web.cookie.slice(web.cookie.indexOf('=') + 1)}`}});
  assert.equal(mobileWithWebBearer.response.status, 401);
  assert.equal(mobileWithWebBearer.payload.error.code, 'INVALID_SESSION');
});

test('exige origem válida para mutação por cookie e permite bearer no mobile', async () => {
  const {cookie} = await createWebSession();
  const noOrigin = await jsonRequest('/api/legal/accept', {method: 'POST', headers: {cookie}, body: {version: '2026-08-30'}});
  assert.equal(noOrigin.response.status, 403);
  assert.equal(noOrigin.payload.error.code, 'ORIGIN_REQUIRED');

  const wrongOrigin = await jsonRequest('/api/legal/accept', {method: 'POST', headers: {cookie, origin: 'http://evil.example'}, body: {version: '2026-08-30'}});
  assert.equal(wrongOrigin.response.status, 403);
  assert.equal(wrongOrigin.payload.error.code, 'ORIGIN_MISMATCH');

  const mobile = await createMobileSession();
  const accepted = await acceptMobileLegal(mobile.token);
  assert.equal(accepted.response.status, 200);
  assert.equal(accepted.payload.session.legalAcceptedVersion, '2026-08-30');
});

test('checkout usa catálogo e saldo no servidor, sem aceitar mutação sem aceite', async () => {
  const web = await createWebSession();
  const key = 'security-checkout-key-001';
  const blocked = await jsonRequest('/api/checkout/commit', {
    method: 'POST',
    headers: {cookie: web.cookie, origin: baseUrl, 'idempotency-key': key},
    body: {productId: 'cesta-fresh', useCashback: true},
  });
  assert.equal(blocked.response.status, 403);
  assert.equal(blocked.payload.error.code, 'LEGAL_ACCEPTANCE_REQUIRED');

  const accepted = await acceptWebLegal(web.cookie);
  assert.equal(accepted.response.status, 200);
  const catalog = await jsonRequest('/api/catalog');
  assert.equal(catalog.response.status, 200);
  assert.equal(catalog.payload.products.find(product => product.id === 'cesta-fresh').priceCents, 6490);

  const checkout = await jsonRequest('/api/checkout/commit', {
    method: 'POST',
    headers: {cookie: web.cookie, origin: baseUrl, 'idempotency-key': key},
    body: {productId: 'cesta-fresh', useCashback: true},
  });
  assert.equal(checkout.response.status, 200);
  assert.equal(checkout.payload.productId, 'cesta-fresh');
  assert.equal(checkout.payload.allocation.grossCents, 6490);
  assert.equal(checkout.payload.allocation.cashbackUsedCents, 2780);
  assert.equal(checkout.payload.allocation.customerPayableCents, 3710);
  assert.equal(checkout.payload.session.orders, 1);
  assert.equal(checkout.payload.session.cashbackCents, 297);
});

test('checkout é idempotente e rejeita reutilização com outro payload', async () => {
  const web = await createWebSession();
  await acceptWebLegal(web.cookie);
  const headers = {cookie: web.cookie, origin: baseUrl, 'idempotency-key': 'repeatable-checkout-key-01'};
  const first = await jsonRequest('/api/checkout/commit', {method: 'POST', headers, body: {productId: 'corte-premium', useCashback: false}});
  const repeated = await jsonRequest('/api/checkout/commit', {method: 'POST', headers, body: {productId: 'corte-premium', useCashback: false}});
  assert.equal(first.response.status, 200);
  assert.deepEqual(repeated.payload, first.payload);

  const conflict = await jsonRequest('/api/checkout/commit', {method: 'POST', headers, body: {productId: 'visita-tecnica', useCashback: false}});
  assert.equal(conflict.response.status, 409);
  assert.equal(conflict.payload.error.code, 'IDEMPOTENCY_KEY_REUSED');
});

test('valida conteúdo, chave de idempotência e produto no checkout', async () => {
  const web = await createWebSession();
  await acceptWebLegal(web.cookie);
  const headers = {cookie: web.cookie, origin: baseUrl, 'idempotency-key': 'validation-checkout-key-01'};

  const badMedia = await fetch(`${baseUrl}/api/checkout/commit`, {method: 'POST', headers});
  assert.equal(badMedia.status, 415);

  const badKey = await jsonRequest('/api/checkout/commit', {method: 'POST', headers: {...headers, 'idempotency-key': 'short'}, body: {productId: 'cesta-fresh', useCashback: false}});
  assert.equal(badKey.response.status, 400);
  assert.equal(badKey.payload.error.code, 'INVALID_IDEMPOTENCY_KEY');

  const unknown = await jsonRequest('/api/checkout/commit', {method: 'POST', headers, body: {productId: 'unknown-product', useCashback: false}});
  assert.equal(unknown.response.status, 404);
  assert.equal(unknown.payload.error.code, 'PRODUCT_NOT_FOUND');
});
