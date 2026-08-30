import Storage from 'expo-sqlite/kv-store';
import {DEFAULT_STATE, parseLocalLifeState} from './lifeState';

export type LocalLifeState = {
  cashback: number;
  orders: number;
  legalConsent: {
    acceptedAt: string;
    context?: string;
    terms: {document: string; version: string; acceptedAt: string};
    privacy: {document: string; version: string; acceptedAt: string};
  } | null;
};

const KEYS = {
  cashback: 'life.cashback',
  orders: 'life.orders',
  legalConsent: 'life.legal-consent',
} as const;

export type {LocalLifeState};
export {DEFAULT_STATE};

export async function loadLocalLifeState(): Promise<LocalLifeState> {
  const [cashbackRaw, ordersRaw, legalConsentRaw] = await Promise.all([
    Storage.getItem(KEYS.cashback),
    Storage.getItem(KEYS.orders),
    Storage.getItem(KEYS.legalConsent),
  ]);

  return parseLocalLifeState(cashbackRaw, ordersRaw, legalConsentRaw) as LocalLifeState;
}

export async function saveLocalLifeState(state: LocalLifeState): Promise<void> {
  await Promise.all([
    Storage.setItem(KEYS.cashback, String(state.cashback)),
    Storage.setItem(KEYS.orders, String(state.orders)),
    Storage.setItem(KEYS.legalConsent, JSON.stringify(state.legalConsent)),
  ]);
}
