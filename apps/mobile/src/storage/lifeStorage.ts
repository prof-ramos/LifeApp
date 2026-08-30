import Storage from 'expo-sqlite/kv-store';

const KEYS = {
  cashback: 'life.cashback',
  orders: 'life.orders',
  legalAcceptedVersion: 'life.legalAcceptedVersion',
} as const;

export type LocalLifeState = {
  cashback: number;
  orders: number;
  legalAcceptedVersion: string | null;
};

const DEFAULT_STATE: LocalLifeState = {
  cashback: 27.8,
  orders: 0,
  legalAcceptedVersion: null,
};

/**
 * Loads the locally stored life state, applying defaults for missing or invalid numeric values.
 *
 * @returns The stored cashback, order count, and accepted legal version
 */
export async function loadLocalLifeState(): Promise<LocalLifeState> {
  const [cashbackRaw, ordersRaw, legalAcceptedVersion] = await Promise.all([
    Storage.getItem(KEYS.cashback),
    Storage.getItem(KEYS.orders),
    Storage.getItem(KEYS.legalAcceptedVersion),
  ]);

  const cashback = cashbackRaw === null ? DEFAULT_STATE.cashback : Number(cashbackRaw);
  const orders = ordersRaw === null ? DEFAULT_STATE.orders : Number(ordersRaw);

  return {
    cashback: Number.isFinite(cashback) ? cashback : DEFAULT_STATE.cashback,
    orders: Number.isFinite(orders) ? orders : DEFAULT_STATE.orders,
    legalAcceptedVersion,
  };
}

/**
 * Persists the local life state.
 *
 * @param state - The cashback, order count, and accepted legal-version data to store
 */
export async function saveLocalLifeState(state: LocalLifeState): Promise<void> {
  await Promise.all([
    Storage.setItem(KEYS.cashback, String(state.cashback)),
    Storage.setItem(KEYS.orders, String(state.orders)),
    state.legalAcceptedVersion === null
      ? Storage.removeItem(KEYS.legalAcceptedVersion)
      : Storage.setItem(KEYS.legalAcceptedVersion, state.legalAcceptedVersion),
  ]);
}
