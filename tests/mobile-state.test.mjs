import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_STATE, LEGAL_VERSION, parseLocalLifeState} from '../apps/mobile/src/storage/lifeState.js';

test('usa os valores padrão quando o armazenamento está vazio', () => {
  assert.deepEqual(parseLocalLifeState(null, null), DEFAULT_STATE);
});

test('converte valores persistidos válidos para o estado mobile', () => {
  assert.deepEqual(parseLocalLifeState('42.50', '3'), {cashback: 42.5, orders: 3, legalConsent: null});
});

test('descarta cashback negativo, infinito e pedidos fracionários ou negativos', () => {
  assert.deepEqual(parseLocalLifeState('-1', '2.5'), DEFAULT_STATE);
  assert.deepEqual(parseLocalLifeState('Infinity', '-1'), DEFAULT_STATE);
  assert.deepEqual(parseLocalLifeState('NaN', '1e309'), DEFAULT_STATE);
});

test('aceita zero como estado válido', () => {
  assert.deepEqual(parseLocalLifeState('0', '0'), {cashback: 0, orders: 0, legalConsent: null});
});

test('mantém o gate jurídico fechado quando o consentimento está ausente ou desatualizado', () => {
  assert.equal(parseLocalLifeState(null, null, null).legalConsent, null);
  assert.equal(parseLocalLifeState('10', '1', JSON.stringify({
    terms: {document: 'terms-of-use', version: '2026-01-01', acceptedAt: '2026-08-30T00:00:00.000Z'},
    privacy: {document: 'privacy-policy', version: LEGAL_VERSION, acceptedAt: '2026-08-30T00:00:00.000Z'},
  })).legalConsent, null);
});

test('normaliza consentimento jurídico com documento e versão para os dois textos', () => {
  const acceptedAt = '2026-08-30T12:00:00.000Z';
  assert.deepEqual(parseLocalLifeState('10', '1', JSON.stringify({
    acceptedAt,
    context: 'mobile-mvp',
    terms: {document: 'terms-of-use', version: LEGAL_VERSION},
    privacy: {document: 'privacy-policy', version: LEGAL_VERSION},
  })).legalConsent, {
    acceptedAt,
    context: 'mobile-mvp',
    terms: {document: 'terms-of-use', version: LEGAL_VERSION, acceptedAt},
    privacy: {document: 'privacy-policy', version: LEGAL_VERSION, acceptedAt},
  });
});
