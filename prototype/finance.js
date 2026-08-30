const CENTS_PER_REAL = 100;

// Monetary values are rounded half-up to cents before and after each allocation.
// Rates remain fractions (for example, 0.15 means 15%).
const toCents = value => {
  if (!Number.isFinite(value) || value < 0) throw new Error('INVALID_MONEY');
  const result = Math.floor(value * CENTS_PER_REAL + 0.5);
  if (!Number.isSafeInteger(result)) throw new Error('MONEY_OUT_OF_RANGE');
  return result;
};

const fromCents = value => value / CENTS_PER_REAL;
const allocate = (baseCents, rate) => Math.floor(baseCents * rate + 0.5);

export function calculateAllocation({gross, platformFeeRate=0.15, pspFeeRate=0.025, cashbackRate=0, condoShareRate=0.10}) {
  // Taxa de plataforma: 15% da receita bruta
  // Taxa PSP: 2,5% da receita bruta
  // Cashback: parte da receita bruta (rate)
  // Receita Life elegível: plataforma - PSP - cashback (floor em 0)
  // Share condomínio: 10% da receita Life elegível
  const grossCents = toCents(gross);
  for (const rate of [platformFeeRate, pspFeeRate, cashbackRate, condoShareRate]) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('INVALID_RATE');
  }

  const platformFeeCents = allocate(grossCents, platformFeeRate);
  const pspFeeCents = allocate(grossCents, pspFeeRate);
  const cashbackEarnedCents = allocate(grossCents, cashbackRate);
  const merchantReceivableCents = grossCents - platformFeeCents;
  const eligibleLifeRevenueCents = Math.max(0, platformFeeCents - pspFeeCents - cashbackEarnedCents);
  const condominiumShareCents = allocate(eligibleLifeRevenueCents, condoShareRate);
  const lifeNetRevenueCents = eligibleLifeRevenueCents - condominiumShareCents;

  return {
    gross: fromCents(grossCents),
    platformFee: fromCents(platformFeeCents),
    pspFee: fromCents(pspFeeCents),
    cashbackEarned: fromCents(cashbackEarnedCents),
    merchantReceivable: fromCents(merchantReceivableCents),
    eligibleLifeRevenue: fromCents(eligibleLifeRevenueCents),
    condominiumShare: fromCents(condominiumShareCents),
    lifeNetRevenue: fromCents(lifeNetRevenueCents),
  };
}

export {toCents};
