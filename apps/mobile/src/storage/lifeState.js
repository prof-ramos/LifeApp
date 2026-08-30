export const DEFAULT_STATE = {
  cashback: 27.8,
  orders: 0,
};

export function parseLocalLifeState(cashbackRaw, ordersRaw) {
  const cashback = cashbackRaw === null ? DEFAULT_STATE.cashback : Number(cashbackRaw);
  const orders = ordersRaw === null ? DEFAULT_STATE.orders : Number(ordersRaw);

  return {
    cashback: Number.isFinite(cashback) && cashback >= 0 ? cashback : DEFAULT_STATE.cashback,
    orders: Number.isSafeInteger(orders) && orders >= 0 ? orders : DEFAULT_STATE.orders,
  };
}
