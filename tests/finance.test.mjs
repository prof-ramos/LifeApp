import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAllocation } from '../prototype/finance.js';

test('calcula cashback e 10% do condomínio sobre receita Life elegível',()=>{
  const r=calculateAllocation({gross:100,cashbackRate:0.04});
  assert.deepEqual(r,{
    gross:100,
    cashbackUsed:0,
    customerPayable:100,
    platformFee:15,
    pspFee:2.5,
    cashbackEarned:4,
    merchantReceivable:85,
    eligibleLifeRevenue:8.5,
    condominiumShare:0.85,
    lifeNetRevenue:7.65
  });
});

test('aplica cashback existente e gera novo cashback somente sobre o valor pago',()=>{
  const r=calculateAllocation({gross:100,cashbackRate:0.04,cashbackUsed:20});
  assert.deepEqual(r,{
    gross:100,
    cashbackUsed:20,
    customerPayable:80,
    platformFee:15,
    pspFee:2,
    cashbackEarned:3.2,
    merchantReceivable:85,
    eligibleLifeRevenue:9.8,
    condominiumShare:0.98,
    lifeNetRevenue:8.82
  });
});

test('rejeita cashback maior que o valor da compra',()=>{
  assert.throws(()=>calculateAllocation({gross:100,cashbackUsed:101}),/INVALID_CASHBACK_USED/);
});

test('nunca cria revenue share quando não há receita Life elegível',()=>{
  const r=calculateAllocation({gross:100,cashbackRate:0.20});
  assert.equal(r.eligibleLifeRevenue,0);
  assert.equal(r.condominiumShare,0);
  assert.equal(r.lifeNetRevenue,0);
});
