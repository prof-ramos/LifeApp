import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_STATE, parseLocalLifeState} from '../apps/mobile/src/storage/lifeState.js';

test('usa os valores padrão quando o armazenamento está vazio', () => {
  assert.deepEqual(parseLocalLifeState(null, null), DEFAULT_STATE);
});

test('converte valores persistidos válidos para o estado mobile', () => {
  assert.deepEqual(parseLocalLifeState('42.50', '3'), {cashback: 42.5, orders: 3});
});

test('descarta cashback negativo, infinito e pedidos fracionários ou negativos', () => {
  assert.deepEqual(parseLocalLifeState('-1', '2.5'), DEFAULT_STATE);
  assert.deepEqual(parseLocalLifeState('Infinity', '-1'), DEFAULT_STATE);
  assert.deepEqual(parseLocalLifeState('NaN', '1e309'), DEFAULT_STATE);
});

test('aceita zero como estado válido', () => {
  assert.deepEqual(parseLocalLifeState('0', '0'), {cashback: 0, orders: 0});
});
