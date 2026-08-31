import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');

function createHarness({storedState = null, fetchImpl = async () => ({ok: true, json: async () => ({allocation: {cashbackEarned: 1, condominiumShare: 0.1}})}), setItemImpl = null} = {}) {
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
      setItem: (key, value) => setItemImpl ? setItemImpl(key, value, values) : values.set(key, value),
    },
    Math,
    navigator: {serviceWorker: {register: async () => {}}},
    Number,
    Date,
    Promise,
    String,
    window: {},
  };

  vm.runInNewContext(source, context, {filename: 'prototype/app.js'});
  return {context, alerts, get markup() { return markup; }, values};
}

function acceptLegal(app) {
  app.context.window.toggleLegal('terms', true);
  app.context.window.toggleLegal('privacy', true);
  app.context.window.acceptLegal();
}

test('renderiza a home mesmo sem estado salvo', () => {
  const app = createHarness();
  assert.match(app.markup, /Antes de continuar/);
  assert.match(app.markup, /Termos de Uso/);
  assert.match(app.markup, /Política de Privacidade/);
});

test('recupera estado corrompido sem interromper o carregamento', () => {
  const app = createHarness({storedState: '{not-json'});
  assert.match(app.markup, /Antes de continuar/);
});

test('grava os dois consentimentos versionados antes de liberar a aplicação', () => {
  const app = createHarness();
  acceptLegal(app);
  const saved = JSON.parse(app.values.get('life-state'));
  assert.equal(saved.legalConsent.terms.document, 'terms-of-use');
  assert.equal(saved.legalConsent.terms.version, '2026-08-30');
  assert.equal(saved.legalConsent.privacy.document, 'privacy-policy');
  assert.equal(saved.legalConsent.privacy.version, '2026-08-30');
  assert.match(app.markup, /SEU DIA NO LIFE/);
});

test('navega para o marketplace pelo contrato público go()', () => {
  const app = createHarness();
  acceptLegal(app);
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

  acceptLegal(app);
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

  acceptLegal(app);
  const previous = app.values.get('life-state');
  await app.context.window.buy(1);

  assert.equal(app.values.get('life-state'), previous);
  assert.match(app.alerts[0], /Nenhuma alteração foi aplicada/);
});

test('falha de persistência do aceite mantém o gate e o estado anterior', () => {
  const app = createHarness({setItemImpl: () => {throw new Error('STORAGE_FAILED')}});
  acceptLegal(app);
  assert.equal(app.values.has('life-state'), false);
  assert.match(app.markup, /Antes de continuar/);
  assert.match(app.alerts[0], /Não foi possível salvar/);
});

test('bloqueia compras concorrentes até a primeira terminar', async () => {
  let calls = 0;
  let resolveFetch;
  const app = createHarness({
    fetchImpl: () => {
      calls += 1;
      return new Promise(resolve => {resolveFetch = resolve;});
    },
  });
  acceptLegal(app);
  const first = app.context.window.buy(1);
  const second = app.context.window.buy(1);
  assert.equal(calls, 1);
  resolveFetch({ok: true, json: async () => ({allocation: {cashbackEarned: 4, condominiumShare: 0.85}})});
  await Promise.all([first, second]);
  assert.equal(JSON.parse(app.values.get('life-state')).orders, 1);
});

test('escapa conteúdo não confiável do feed social', () => {
  const app = createHarness({
    storedState: JSON.stringify({posts: [{author: '<img src=x>', text: '<script>alert(1)</script>', rating: 99}]}),
  });
  acceptLegal(app);
  app.context.window.go('social');
  assert.doesNotMatch(app.markup, /<img src=x>|<script>alert\(1\)<\/script>/);
  assert.match(app.markup, /&lt;img src=x&gt;/);
});
