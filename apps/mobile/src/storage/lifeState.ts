export type LocalLifeState = {
  cashback: number;
  orders: number;
};

export const DEFAULT_STATE: LocalLifeState = {
  cashback: 27.8,
  orders: 0,
};

export function parseLocalLifeState(
  cashbackRaw: string | null,
  ordersRaw: string | null,
): LocalLifeState {
  const cashback = cashbackRaw === null ? DEFAULT_STATE.cashback : Number(cashbackRaw);
  const orders = ordersRaw === null ? DEFAULT_STATE.orders : Number(ordersRaw);

  return {
    cashback: Number.isFinite(cashback) && cashback >= 0 ? cashback : DEFAULT_STATE.cashback,
    orders: Number.isSafeInteger(orders) && orders >= 0 ? orders : DEFAULT_STATE.orders,
  };
}
