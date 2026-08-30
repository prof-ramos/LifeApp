import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAllocation } from '../prototype/finance.js';

test('calcula cashback e 10% do condomínio usando centavos inteiros',()=>{
  const r=calculateAllocation({grossCents:10_000,cashbackBps:400});
  assert.deepEqual(r,{grossCents:10_000,cashbackUsedCents:0,customerPayableCents:10_000,platformFeeCents:1500,pspFeeCents:250,cashbackEarnedCents:400,merchantReceivableCents:8500,eligibleLifeRevenueCents:850,condominiumShareCents:85,lifeNetRevenueCents:765});
});

test('aplica cashback e gera novo cashback somente sobre o valor pago',()=>{
  const r=calculateAllocation({grossCents:10_000,cashbackBps:400,cashbackUsedCents:2000});
  assert.deepEqual(r,{grossCents:10_000,cashbackUsedCents:2000,customerPayableCents:8000,platformFeeCents:1500,pspFeeCents:200,cashbackEarnedCents:320,merchantReceivableCents:8500,eligibleLifeRevenueCents:980,condominiumShareCents:98,lifeNetRevenueCents:882});
});

test('rejeita valores fracionários, negativos ou cashback maior que a compra',()=>{
  assert.throws(()=>calculateAllocation({grossCents:100.5}),/INVALID_GROSS/);
  assert.throws(()=>calculateAllocation({grossCents:-1}),/INVALID_GROSS/);
  assert.throws(()=>calculateAllocation({grossCents:100,cashbackUsedCents:101}),/INVALID_CASHBACK_USED/);
});

test('rejeita taxas fora de basis points válidos',()=>{
  assert.throws(()=>calculateAllocation({grossCents:100,cashbackBps:10_001}),/INVALID_RATE/);
});

test('nunca cria revenue share quando não há receita Life elegível',()=>{
  const r=calculateAllocation({grossCents:10_000,cashbackBps:2000});
  assert.equal(r.eligibleLifeRevenueCents,0);
  assert.equal(r.condominiumShareCents,0);
  assert.equal(r.lifeNetRevenueCents,0);
});
