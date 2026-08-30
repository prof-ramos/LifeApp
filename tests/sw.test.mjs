import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../prototype/sw.js', import.meta.url), 'utf8');

function createHarness() {
  const listeners = new Map();
  const cache = {
    addAll: async assets => { cache.assets = assets; },
  };
  const cacheStore = new Map([['life-mvp-v1', {}], ['life-mvp-v2', cache]]);
  const context = {
    caches: {
      open: async key => cacheStore.get(key) ?? cacheStore.set(key, {addAll: async () => {}}).get(key),
      keys: async () => [...cacheStore.keys()],
      delete: async key => cacheStore.delete(key),
      match: async request => request.url === '/cached.js' ? {status: 200, body: 'cached'} : undefined,
    },
    fetch: async request => ({status: 200, body: `network:${request.url}`}),
    self: {
      addEventListener: (name, handler) => listeners.set(name, handler),
      clients: {claim: async () => {context.claimed = true;}},
      skipWaiting: async () => {context.skipped = true;},
    },
  };
  vm.runInNewContext(source, context, {filename: 'prototype/sw.js'});
  return {context, listeners, cacheStore};
}

async function runLifecycleEvent(handler) {
  let promise;
  handler({waitUntil: value => {promise = value;}});
  await promise;
}

test('instala os assets e ativa imediatamente', async () => {
  const app = createHarness();
  await runLifecycleEvent(app.listeners.get('install'));
  assert.equal(JSON.stringify(app.cacheStore.get('life-mvp-v2').assets), JSON.stringify(['/', '/index.html', '/styles.css', '/app.js', '/manifest.webmanifest']));
  assert.equal(app.context.skipped, true);
});

test('remove caches antigos e assume controle dos clientes na ativação', async () => {
  const app = createHarness();
  await runLifecycleEvent(app.listeners.get('activate'));
  assert.equal(app.cacheStore.has('life-mvp-v1'), false);
  assert.equal(app.context.claimed, true);
});

test('usa resposta cacheada antes da rede para GET', async () => {
  const app = createHarness();
  let response;
  await new Promise(resolve => app.listeners.get('fetch')({
    request: {method: 'GET', url: '/cached.js'},
    respondWith: value => { response = value; resolve(); },
  }));
  assert.deepEqual(await response, {status: 200, body: 'cached'});
});

test('não intercepta requisições que não são GET', () => {
  const app = createHarness();
  let intercepted = false;
  app.listeners.get('fetch')({
    request: {method: 'POST', url: '/api/checkout/quote'},
    respondWith: () => { intercepted = true; },
  });
  assert.equal(intercepted, false);
});
