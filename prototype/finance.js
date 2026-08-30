export function calculateAllocation({gross, platformFeeRate=0.15, pspFeeRate=0.025, cashbackRate=0, condoShareRate=0.10, cashbackUsed=0}) {
  const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
  if (!Number.isFinite(gross) || gross < 0) throw new Error('INVALID_GROSS');
  if (!Number.isFinite(cashbackUsed) || cashbackUsed < 0 || cashbackUsed > gross) throw new Error('INVALID_CASHBACK_USED');
  for (const rate of [platformFeeRate,pspFeeRate,cashbackRate,condoShareRate]) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('INVALID_RATE');
  }
  const normalizedGross=cents(gross);
  const normalizedCashbackUsed=cents(cashbackUsed);
  const customerPayable=cents(normalizedGross-normalizedCashbackUsed);
  const platformFee=cents(normalizedGross*platformFeeRate);
  const pspFee=cents(customerPayable*pspFeeRate);
  const cashbackEarned=cents(customerPayable*cashbackRate);
  const merchantReceivable=cents(normalizedGross-platformFee);
  const eligibleLifeRevenue=cents(Math.max(0,platformFee-pspFee-cashbackEarned));
  const condominiumShare=cents(eligibleLifeRevenue*condoShareRate);
  const lifeNetRevenue=cents(eligibleLifeRevenue-condominiumShare);
  return {gross:normalizedGross,cashbackUsed:normalizedCashbackUsed,customerPayable,platformFee,pspFee,cashbackEarned,merchantReceivable,eligibleLifeRevenue,condominiumShare,lifeNetRevenue};
}
