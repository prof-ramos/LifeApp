import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const port = 45_000 + Math.floor(Math.random() * 1_000);
const baseUrl = `http://127.0.0.1:${port}`;
let server;

function cookieFrom(response) {
  return response.headers.get('set-cookie')?.split(';', 1)[0];
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

async function jsonRequest(path, {cookie, token, origin, key, ...options} = {}) {
  const headers = new Headers(options.headers);
  if (cookie) headers.set('cookie', cookie);
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (origin) headers.set('origin', origin);
  if (key) headers.set('idempotency-key', key);
  return request(path, {...options, headers});
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await request('/api/health');
      if (response.ok) return;
    } catch {
      // Process may still be starting.
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('server did not start');
}

test.before(async () => {
  server = spawn(process.execPath, ['server.mjs'], {
    cwd: '/tmp/LifeApp-hardening',
    env: {...process.env, NODE_ENV: 'development', PAYMENT_PROVIDER: 'mock', PORT: String(port)},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer();
});

test.after(async () => {
  server.kill('SIGTERM');
  await new Promise(resolve => server.once('exit', resolve));
});

test('sessão Web usa cookie HttpOnly e não expõe bearer token', async () => {
  const response = await request('/api/session');
  assert.equal(response.status, 200);
  const payload = await response.json();
  const cookie = cookieFrom(response);

  assert.ok(cookie?.startsWith('life_session='));
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.match(response.headers.get('set-cookie'), /SameSite=Strict/);
  assert.equal(payload.sessionToken, undefined);
  assert.equal(payload.session.role, 'resident');
});

test('sessão mobile usa bearer independente e não cria cookie', async () => {
  const response = await request('/api/mobile/session');
  assert.equal(response.status, 200);
  const payload = await response.json();

  assert.equal(typeof payload.sessionToken, 'string');
  assert.equal(response.headers.get('set-cookie'), null);

  const webResponse = await jsonRequest('/api/session', {token: payload.sessionToken});
  assert.equal(webResponse.status, 400);
  assert.equal((await webResponse.json()).error.code, 'USE_MOBILE_SESSION_ENDPOINT');
});

test('token Web não é aceito como sessão mobile', async () => {
  const web = await request('/api/session');
  const webToken = cookieFrom(web).split('=', 2)[1];
  const mobile = await jsonRequest('/api/mobile/session', {token: webToken});

  assert.equal(mobile.status, 401);
  assert.equal((await mobile.json()).error.code, 'INVALID_SESSION');
});

test('aceite jurídico é obrigatório antes do checkout e respeita origem Web', async () => {
  const session = await request('/api/session');
  const cookie = cookieFrom(session);
  const sessionPayload = await session.json();
  const origin = baseUrl;

  const before = await jsonRequest('/api/checkout/commit', {
    cookie,
    origin,
    key: 'checkout-before-legal',
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({productId: 'cesta-fresh', useCashback: false}),
  });
  assert.equal(before.status, 403);
  assert.equal((await before.json()).error.code, 'LEGAL_ACCEPTANCE_REQUIRED');

  const accepted = await jsonRequest('/api/legal/accept', {
    cookie,
    origin,
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({version: sessionPayload.legalVersion ?? '2026-08-30'}),
  });
  assert.equal(accepted.status, 200);
});

test('checkout é idempotente e rejeita reuso da chave com payload diferente', async () => {
  const session = await request('/api/session');
  const cookie = cookieFrom(session);
  const origin = baseUrl;
  await jsonRequest('/api/legal/accept', {
    cookie,
    origin,
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({version: '2026-08-30'}),
  });

  const options = {
    cookie,
    origin,
    key: 'checkout-idempotency-1',
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({productId: 'cesta-fresh', useCashback: false}),
  };
  const first = await jsonRequest('/api/checkout/commit', options);
  const firstPayload = await first.json();
  assert.equal(first.status, 200);
  assert.equal(firstPayload.session.orders, 1);

  const repeat = await jsonRequest('/api/checkout/commit', options);
  const repeatPayload = await repeat.json();
  assert.equal(repeat.status, 200);
  assert.deepEqual(repeatPayload, firstPayload);

  const conflict = await jsonRequest('/api/checkout/commit', {
    ...options,
    body: JSON.stringify({productId: 'corte-premium', useCashback: false}),
  });
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error.code, 'IDEMPOTENCY_KEY_REUSED');
});

test('checkout rejeita content type, JSON e produto inválidos', async () => {
  const session = await request('/api/session');
  const cookie = cookieFrom(session);
  const origin = baseUrl;
  await jsonRequest('/api/legal/accept', {
    cookie,
    origin,
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({version: '2026-08-30'}),
  });

  const unsupported = await jsonRequest('/api/checkout/commit', {
    cookie, origin, key: 'checkout-content-type', method: 'POST', body: '{}',
  });
  assert.equal(unsupported.status, 415);

  const invalidJson = await jsonRequest('/api/checkout/commit', {
    cookie, origin, key: 'checkout-invalid-json', method: 'POST',
    headers: {'content-type': 'application/json'}, body: '{bad',
  });
  assert.equal(invalidJson.status, 400);
  assert.equal((await invalidJson.json()).error.code, 'INVALID_JSON');

  const unknownProduct = await jsonRequest('/api/checkout/commit', {
    cookie, origin, key: 'checkout-unknown-product', method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({productId: 'unknown', useCashback: false}),
  });
  assert.equal(unknownProduct.status, 404);
  assert.equal((await unknownProduct.json()).error.code, 'PRODUCT_NOT_FOUND');
});

test('respostas API incluem headers de segurança', async () => {
  const response = await request('/api/health');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
});
