import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');

function createHarness({storedState = null, fetchImpl = async () => ({ok: true, json: async () => ({allocation: {cashbackEarned: 1, condominiumShare: 0.1}})})} = {}) {
  let markup = '';
  const values = new Map(storedState === null ? [] : [['life-state', storedState]]);
  const alerts = [];
  const root = {set innerHTML(value) { markup = value; }, get innerHTML() { return markup; }};
  const context = {
    alert: message => alerts.push(message),
    clearTimeout,
    console,
    document: {querySelector: selector => selector === '#app' ? root : null},
    fetch: fetchImpl,
    Intl,
    JSON,
    localStorage: {
      getItem: key => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, value),
    },
    Math,
    navigator: {serviceWorker: {register: async () => {}}},
    Number,
    Promise,
    String,
    window: {},
  };

  vm.runInNewContext(source, context, {filename: 'prototype/app.js'});
  return {context, alerts, get markup() { return markup; }, values};
}

test('renderiza a home mesmo sem estado salvo', () => {
  const app = createHarness();
  assert.match(app.markup, /SEU DIA NO LIFE/);
  assert.match(app.markup, /27,80/);
});

test('recupera estado corrompido sem interromper o carregamento', () => {
  const app = createHarness({storedState: '{not-json'});
  assert.match(app.markup, /27,80/);
});

test('navega para o marketplace pelo contrato público go()', () => {
  const app = createHarness();
  app.context.window.go('market');
  assert.match(app.markup, /Marketplace/);
  assert.match(app.markup, /Comprar no Life/);
});

test('compra atualiza cashback e pedidos somente após cotação bem-sucedida', async () => {
  const app = createHarness({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({allocation: {cashbackEarned: 4, condominiumShare: 0.85}}),
    }),
  });

  await app.context.window.buy(1);

  const state = JSON.parse(app.values.get('life-state'));
  assert.equal(state.cashback, 31.8);
  assert.equal(state.orders, 1);
  assert.equal(state.condoRevenue, 0.85);
  assert.match(app.alerts[0], /Pagamento MVP aprovado/);
});

test('falha da cotação não altera o estado local', async () => {
  const app = createHarness({
    fetchImpl: async () => ({ok: false, json: async () => ({})}),
  });

  await app.context.window.buy(1);

  assert.equal(app.values.get('life-state'), undefined);
  assert.match(app.alerts[0], /Nenhuma alteração foi aplicada/);
});

test('escapa conteúdo não confiável do feed social', () => {
  const app = createHarness({
    storedState: JSON.stringify({posts: [{author: '<img src=x>', text: '<script>alert(1)</script>', rating: 99}]}),
  });
  app.context.window.go('social');
  assert.doesNotMatch(app.markup, /<img src=x>|<script>alert\(1\)<\/script>/);
  assert.match(app.markup, /&lt;img src=x&gt;/);
});
