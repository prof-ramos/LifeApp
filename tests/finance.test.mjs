import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAllocation } from '../prototype/finance.js';

test('calcula cashback e 10% do condomínio sobre receita Life elegível',()=>{
  const r=calculateAllocation({gross:100,cashbackRate:0.04});
  assert.deepEqual(r,{
    gross:100,
    platformFee:15,
    pspFee:2.5,
    cashbackEarned:4,
    merchantReceivable:85,
    eligibleLifeRevenue:8.5,
    condominiumShare:0.85,
    lifeNetRevenue:7.65
  });
});

test('nunca cria revenue share quando não há receita Life elegível',()=>{
  const r=calculateAllocation({gross:100,cashbackRate:0.20});
  assert.equal(r.eligibleLifeRevenue,0);
  assert.equal(r.condominiumShare,0);
  assert.equal(r.lifeNetRevenue,0);
});

test('arredonda o valor bruto para centavos antes de alocar',()=>{
  const r=calculateAllocation({gross:10.005, cashbackRate:0.1});
  assert.equal(r.gross,10.01);
  assert.equal(r.platformFee,1.5);
  assert.equal(r.cashbackEarned,1);
});

test('aceita zero e rejeita dinheiro inválido ou fora do intervalo seguro',()=>{
  assert.equal(calculateAllocation({gross:0}).gross,0);
  assert.throws(() => calculateAllocation({gross:-0.01}), {message:'INVALID_MONEY'});
  assert.throws(() => calculateAllocation({gross:NaN}), {message:'INVALID_MONEY'});
  assert.throws(() => calculateAllocation({gross:Number.MAX_SAFE_INTEGER}), {message:'MONEY_OUT_OF_RANGE'});
});

test('rejeita taxas inválidas',()=>{
  assert.throws(() => calculateAllocation({gross:10, cashbackRate:-0.01}), {message:'INVALID_RATE'});
  assert.throws(() => calculateAllocation({gross:10, cashbackRate:1.01}), {message:'INVALID_RATE'});
  assert.throws(() => calculateAllocation({gross:10, cashbackRate:NaN}), {message:'INVALID_RATE'});
});

test('é determinística para a mesma entrada',()=>{
  const input={gross:79.9, cashbackRate:0.1};
  assert.deepEqual(calculateAllocation(input), calculateAllocation(input));
});
