export const DEFAULT_STATE = {
  cashback: 27.8,
  orders: 0,
  legalConsent: null,
};

export const LEGAL_VERSION = '2026-08-30';
export const LEGAL_DOCUMENTS = [
  {key: 'terms', document: 'terms-of-use', label: 'Termos de Uso', path: `/legal/terms-${LEGAL_VERSION}.html`},
  {key: 'privacy', document: 'privacy-policy', label: 'Política de Privacidade', path: `/legal/privacy-${LEGAL_VERSION}.html`},
];

const parseJson = raw => {
  if (typeof raw !== 'string') return raw;
  try { return JSON.parse(raw); } catch { return null; }
};

const validTimestamp = value => typeof value === 'string' && value.length > 0;

function parseLegalConsent(raw) {
  const value = parseJson(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const acceptedAt = validTimestamp(value.acceptedAt) ? value.acceptedAt : null;
  const normalized = {};
  for (const legalDocument of LEGAL_DOCUMENTS) {
    const entry = value[legalDocument.key];
    if (!entry || entry.document !== legalDocument.document || entry.version !== LEGAL_VERSION) return null;
    const entryAcceptedAt = validTimestamp(entry.acceptedAt) ? entry.acceptedAt : acceptedAt;
    if (!entryAcceptedAt) return null;
    normalized[legalDocument.key] = {
      document: legalDocument.document,
      version: LEGAL_VERSION,
      acceptedAt: entryAcceptedAt,
    };
  }

  return {
    acceptedAt: acceptedAt || normalized.terms.acceptedAt,
    ...(typeof value.context === 'string' ? {context: value.context} : {}),
    ...normalized,
  };
}

/**
 * @param {string|number|null|undefined} cashbackRaw
 * @param {string|number|null|undefined} ordersRaw
 * @param {string|Record<string, unknown>|null|undefined} legalConsentRaw
 */
export function parseLocalLifeState(cashbackRaw, ordersRaw, legalConsentRaw = null) {
  const cashback = cashbackRaw === null ? DEFAULT_STATE.cashback : Number(cashbackRaw);
  const orders = ordersRaw === null ? DEFAULT_STATE.orders : Number(ordersRaw);

  return {
    cashback: Number.isFinite(cashback) && cashback >= 0 ? cashback : DEFAULT_STATE.cashback,
    orders: Number.isSafeInteger(orders) && orders >= 0 ? orders : DEFAULT_STATE.orders,
    legalConsent: legalConsentRaw === null ? DEFAULT_STATE.legalConsent : parseLegalConsent(legalConsentRaw),
  };
}
