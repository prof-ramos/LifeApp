import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAllocation, toCents } from '../prototype/finance.js';

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

test('aceita as taxas-limite zero e cem por cento',()=>{
  const zero = calculateAllocation({gross:100, cashbackRate:0, condoShareRate:0});
  assert.equal(zero.cashbackEarned, 0);
  assert.equal(zero.condominiumShare, 0);

  const fullCashback = calculateAllocation({gross:100, cashbackRate:1});
  assert.equal(fullCashback.cashbackEarned, 100);
  assert.equal(fullCashback.eligibleLifeRevenue, 0);
});

test('rejeita todas as taxas fora do intervalo permitido',()=>{
  for (const field of ['platformFeeRate', 'pspFeeRate', 'cashbackRate', 'condoShareRate']) {
    assert.throws(() => calculateAllocation({gross:100, [field]:-0.01}), {message:'INVALID_RATE'});
    assert.throws(() => calculateAllocation({gross:100, [field]:1.01}), {message:'INVALID_RATE'});
    assert.throws(() => calculateAllocation({gross:100, [field]:NaN}), {message:'INVALID_RATE'});
  }
});

test('mantém a receita elegível em zero quando taxas e cashback consomem a plataforma',()=>{
  const r = calculateAllocation({gross:0.01, platformFeeRate:0, pspFeeRate:1, cashbackRate:1});
  assert.equal(r.eligibleLifeRevenue, 0);
  assert.equal(r.condominiumShare, 0);
  assert.equal(r.lifeNetRevenue, 0);
});

test('rejeita dinheiro maior que o intervalo seguro em centavos',()=>{
  assert.throws(() => calculateAllocation({gross:Number.MAX_SAFE_INTEGER / 100}), {message:'MONEY_OUT_OF_RANGE'});
});

test('rejeita parâmetros ausentes ou objetos nulos',()=>{
  assert.throws(() => calculateAllocation({}), {message:'INVALID_MONEY'});
  assert.throws(() => calculateAllocation(null), TypeError);
});

test('preserva os invariantes da alocação em centavos',()=>{
  const r = calculateAllocation({gross:123.45, cashbackRate:0.08});
  assert.equal(toCents(r.merchantReceivable) + toCents(r.platformFee), toCents(r.gross));
  assert.equal(toCents(r.eligibleLifeRevenue), Math.max(0, toCents(r.platformFee) - toCents(r.pspFee) - toCents(r.cashbackEarned)));
  assert.equal(toCents(r.condominiumShare) + toCents(r.lifeNetRevenue), toCents(r.eligibleLifeRevenue));
});

test('arredonda meio centavo para cima de forma determinística',()=>{
  const r = calculateAllocation({gross:0.01, platformFeeRate:0.5, pspFeeRate:0, cashbackRate:0, condoShareRate:0});
  assert.equal(r.platformFee, 0.01);
});
