const assertInt=(value,code)=>{if(!Number.isSafeInteger(value)||value<0)throw new Error(code)};
const assertBps=(value)=>{if(!Number.isSafeInteger(value)||value<0||value>10_000)throw new Error('INVALID_RATE')};
const rate=(cents,bps)=>Math.round((cents*bps)/10_000);

export function calculateAllocation({
  grossCents,
  platformFeeBps=1500,
  pspFeeBps=250,
  cashbackBps=0,
  condoShareBps=1000,
  cashbackUsedCents=0,
}) {
  assertInt(grossCents,'INVALID_GROSS');
  assertInt(cashbackUsedCents,'INVALID_CASHBACK_USED');
  if(cashbackUsedCents>grossCents)throw new Error('INVALID_CASHBACK_USED');
  [platformFeeBps,pspFeeBps,cashbackBps,condoShareBps].forEach(assertBps);

  const customerPayableCents=grossCents-cashbackUsedCents;
  const platformFeeCents=rate(grossCents,platformFeeBps);
  const pspFeeCents=rate(customerPayableCents,pspFeeBps);
  const cashbackEarnedCents=rate(customerPayableCents,cashbackBps);
  const merchantReceivableCents=grossCents-platformFeeCents;
  const eligibleLifeRevenueCents=Math.max(0,platformFeeCents-pspFeeCents-cashbackEarnedCents);
  const condominiumShareCents=rate(eligibleLifeRevenueCents,condoShareBps);
  const lifeNetRevenueCents=eligibleLifeRevenueCents-condominiumShareCents;

  return {
    grossCents,
    cashbackUsedCents,
    customerPayableCents,
    platformFeeCents,
    pspFeeCents,
    cashbackEarnedCents,
    merchantReceivableCents,
    eligibleLifeRevenueCents,
    condominiumShareCents,
    lifeNetRevenueCents,
  };
}
