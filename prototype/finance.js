/**
 * Calculates normalized financial allocation amounts from a gross amount, rates, and applied cashback.
 * @param {Object} options - Allocation inputs.
 * @param {number} options.gross - Gross amount, which must be finite and greater than or equal to zero.
 * @param {number} [options.platformFeeRate=0.15] - Platform fee rate from 0 to 1.
 * @param {number} [options.pspFeeRate=0.025] - PSP fee rate from 0 to 1.
 * @param {number} [options.cashbackRate=0] - Cashback earning rate from 0 to 1.
 * @param {number} [options.condoShareRate=0.10] - Condominium share rate from 0 to 1.
 * @param {number} [options.cashbackUsed=0] - Cashback applied to the gross amount, from zero through the gross amount.
 * @returns {Object} The normalized gross amount, cashback used, customer payable amount, fees, cashback earned, merchant receivable, eligible life revenue, condominium share, and life net revenue.
 * @throws {Error} `INVALID_GROSS` if `gross` is not finite or is less than zero.
 * @throws {Error} `INVALID_CASHBACK_USED` if `cashbackUsed` is not finite, is less than zero, or exceeds `gross`.
 * @throws {Error} `INVALID_RATE` if any rate is not finite or is outside the range from 0 to 1.
 */
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
