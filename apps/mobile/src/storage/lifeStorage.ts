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
  state: 'life.state',
  cashback: 'life.cashback',
  orders: 'life.orders',
  legalConsent: 'life.legal-consent',
} as const;

export {DEFAULT_STATE};

export async function loadLocalLifeState(): Promise<LocalLifeState> {
  const stateRaw = await Storage.getItem(KEYS.state);
  if (stateRaw !== null) {
    try {
      const state = JSON.parse(stateRaw) as Partial<LocalLifeState>;
      return parseLocalLifeState(state.cashback, state.orders, state.legalConsent) as LocalLifeState;
    } catch {
      // Um estado agregado corrompido não deve impedir a migração dos valores legados.
    }
  }

  const [cashbackRaw, ordersRaw, legalConsentRaw] = await Promise.all([
    Storage.getItem(KEYS.cashback),
    Storage.getItem(KEYS.orders),
    Storage.getItem(KEYS.legalConsent),
  ]);

  return parseLocalLifeState(cashbackRaw, ordersRaw, legalConsentRaw) as LocalLifeState;
}

export async function saveLocalLifeState(state: LocalLifeState): Promise<void> {
  // Uma única chave mantém o próximo estado indivisível para o consumidor.
  await Storage.setItem(KEYS.state, JSON.stringify(state));
}
