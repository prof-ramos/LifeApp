import Storage from 'expo-sqlite/kv-store';
import {DEFAULT_STATE, parseLocalLifeState} from './lifeState';
import type {LocalLifeState} from './lifeState';

const KEYS = {
  cashback: 'life.cashback',
  orders: 'life.orders',
} as const;

export type {LocalLifeState};
export {DEFAULT_STATE};

export async function loadLocalLifeState(): Promise<LocalLifeState> {
  const [cashbackRaw, ordersRaw] = await Promise.all([
    Storage.getItem(KEYS.cashback),
    Storage.getItem(KEYS.orders),
  ]);

  return parseLocalLifeState(cashbackRaw, ordersRaw);
}

export async function saveLocalLifeState(state: LocalLifeState): Promise<void> {
  await Promise.all([
    Storage.setItem(KEYS.cashback, String(state.cashback)),
    Storage.setItem(KEYS.orders, String(state.orders)),
  ]);
}
