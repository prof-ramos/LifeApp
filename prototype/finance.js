export function calculateAllocation({gross, platformFeeRate=0.15, pspFeeRate=0.025, cashbackRate=0, condoShareRate=0.10}) {
  const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
  if (!Number.isFinite(gross) || gross < 0) throw new Error('INVALID_GROSS');
  for (const rate of [platformFeeRate,pspFeeRate,cashbackRate,condoShareRate]) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('INVALID_RATE');
  }
  const platformFee=cents(gross*platformFeeRate);
  const pspFee=cents(gross*pspFeeRate);
  const cashbackEarned=cents(gross*cashbackRate);
  const merchantReceivable=cents(gross-platformFee);
  const eligibleLifeRevenue=cents(Math.max(0,platformFee-pspFee-cashbackEarned));
  const condominiumShare=cents(eligibleLifeRevenue*condoShareRate);
  const lifeNetRevenue=cents(eligibleLifeRevenue-condominiumShare);
  return {gross:cents(gross),platformFee,pspFee,cashbackEarned,merchantReceivable,eligibleLifeRevenue,condominiumShare,lifeNetRevenue};
}
