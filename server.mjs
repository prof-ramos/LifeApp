import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { calculateAllocation } from './prototype/finance.js';
import { DEMO_PRODUCTS, PUBLIC_PRODUCTS } from './prototype/catalog.js';

const root = fileURLToPath(new URL('./prototype/', import.meta.url));
const rootResolved = resolve(root);
const LEGAL_VERSION = '2026-08-30';
const MAX_BODY_BYTES = 64_000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 1_000;
const MAX_RATE_BUCKETS = 2_000;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json; charset=utf-8',
};

// O estado é process-local apenas para demonstrar o contrato; produção usa persistência.
const sessions = new Map();
const rateBuckets = new Map();

const securityHeaders = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'cross-origin-opener-policy': 'same-origin',
};

const writeHead = (res, status, headers = {}) => res.writeHead(status, {...securityHeaders, ...headers});
const json = (res, status, data, headers = {}) => {
  writeHead(res, status, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers});
  res.end(JSON.stringify(data));
};
const apiError = (res, status, code, message = 'Não foi possível processar a solicitação.') => json(res, status, {error: {code, message}});

function parseCookies(req) {
  const entries = (req.headers.cookie || '').split(';').map(value => value.trim()).filter(Boolean);
  return Object.fromEntries(entries.map(value => {
    const separator = value.indexOf('=');
    if (separator < 0) return [value, ''];
    try {
      return [value.slice(0, separator), decodeURIComponent(value.slice(separator + 1))];
    } catch {
      return [value.slice(0, separator), ''];
    }
  }));
}

function bearer(req) {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : null;
}

function cleanupSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(token);
  }
  while (sessions.size >= MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
}

function newSession(kind) {
  cleanupSessions();
  const session = {
    token: randomUUID(),
    kind,
    role: 'resident',
    cashbackCents: 2_780,
    orders: 0,
    condoRevenueCents: 0,
    legalAcceptedVersion: null,
    createdAt: Date.now(),
    idempotency: new Map(),
  };
  sessions.set(session.token, session);
  return session;
}

function lookupSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function webSession(req, {create = false} = {}) {
  if (bearer(req)) return null;
  const token = parseCookies(req).life_session;
  const session = lookupSession(token);
  if (session?.kind === 'web') return session;
  return create ? newSession('web') : null;
}

function mobileSession(req, {create = false} = {}) {
  const token = bearer(req);
  const cookieToken = parseCookies(req).life_session;
  if (token && cookieToken) return null;
  if (token) {
    const session = lookupSession(token);
    return session?.kind === 'mobile' ? session : null;
  }
  if (cookieToken) return null;
  return create ? newSession('mobile') : null;
}

function publicSession(session) {
  return {
    role: session.role,
    cashbackCents: session.cashbackCents,
    orders: session.orders,
    condoRevenueCents: session.condoRevenueCents,
    legalAcceptedVersion: session.legalAcceptedVersion,
  };
}

function setSessionCookie(session, req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const secure = forwardedProto === 'https' || String(process.env.APP_URL || '').startsWith('https://');
  return `life_session=${encodeURIComponent(session.token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${secure ? '; Secure' : ''}`;
}

function clientIp(req) {
  return String(req.socket.remoteAddress || 'unknown');
}

function cleanupRateBuckets(now, windowMs) {
  if (rateBuckets.size < MAX_RATE_BUCKETS) return;
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.start >= windowMs) rateBuckets.delete(key);
  }
  while (rateBuckets.size >= MAX_RATE_BUCKETS) rateBuckets.delete(rateBuckets.keys().next().value);
}

function checkRate(req, key, limit, windowMs) {
  const bucketKey = `${clientIp(req)}:${key}`;
  const now = Date.now();
  cleanupRateBuckets(now, windowMs);
  const previous = rateBuckets.get(bucketKey);
  if (!previous || now - previous.start >= windowMs) {
    rateBuckets.set(bucketKey, {start: now, count: 1});
    return true;
  }
  if (previous.count >= limit) return false;
  previous.count += 1;
  return true;
}

async function readJsonBody(req) {
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    const error = new Error('UNSUPPORTED_MEDIA_TYPE');
    error.status = 415;
    throw error;
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
      const error = new Error('PAYLOAD_TOO_LARGE');
      error.status = 413;
      throw error;
    }
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    const error = new Error('INVALID_JSON');
    error.status = 400;
    throw error;
  }
}

function exactObject(input, keys) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const actual = Object.keys(input).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function requireSession(req, res) {
  const session = bearer(req) ? mobileSession(req) : webSession(req);
  if (!session) {
    apiError(res, 401, 'UNAUTHENTICATED', 'Sessão necessária.');
    return null;
  }
  return session;
}

function requireLegal(session, res) {
  if (session.legalAcceptedVersion !== LEGAL_VERSION) {
    apiError(res, 403, 'LEGAL_ACCEPTANCE_REQUIRED', 'Aceite a versão jurídica vigente antes de continuar.');
    return false;
  }
  return true;
}

function requireRole(session, res, role) {
  if (session.role !== role) {
    apiError(res, 403, 'FORBIDDEN', 'Operação não permitida para este perfil.');
    return false;
  }
  return true;
}

function requireSameOriginForCookie(req, res) {
  if (bearer(req)) return true;
  const origin = req.headers.origin;
  if (!origin) {
    apiError(res, 403, 'ORIGIN_REQUIRED');
    return false;
  }
  try {
    const parsed = new URL(origin);
    const host = String(req.headers.host || '');
    if (parsed.host !== host) {
      apiError(res, 403, 'ORIGIN_MISMATCH');
      return false;
    }
  } catch {
    apiError(res, 403, 'INVALID_ORIGIN');
    return false;
  }
  return true;
}

function allocationCents(allocation) {
  return {
    grossCents: Math.round(allocation.gross * 100),
    cashbackUsedCents: Math.round(allocation.cashbackUsed * 100),
    customerPayableCents: Math.round(allocation.customerPayable * 100),
    platformFeeCents: Math.round(allocation.platformFee * 100),
    pspFeeCents: Math.round(allocation.pspFee * 100),
    cashbackEarnedCents: Math.round(allocation.cashbackEarned * 100),
    merchantReceivableCents: Math.round(allocation.merchantReceivable * 100),
    eligibleLifeRevenueCents: Math.round(allocation.eligibleLifeRevenue * 100),
    condominiumShareCents: Math.round(allocation.condominiumShare * 100),
    lifeNetRevenueCents: Math.round(allocation.lifeNetRevenue * 100),
  };
}

export function createApp() {
  return createServer(async (req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname);
    } catch {
      return json(res, 400, {error: {code: 'INVALID_URL', message: 'Não foi possível processar a solicitação.'}});
    }

    try {
      if (pathname.startsWith('/api/') && !checkRate(req, 'api', 240, 60_000)) {
        return apiError(res, 429, 'RATE_LIMITED', 'Muitas solicitações. Tente novamente em instantes.');
      }

      if (pathname === '/api/health') {
        if (req.method !== 'GET') return json(res, 405, {error: {code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.'}});
        return json(res, 200, {status: 'ok', service: 'life-mvp', mode: 'demo', time: new Date().toISOString()});
      }

      if (pathname === '/api/catalog') {
        if (req.method !== 'GET') return json(res, 405, {error: {code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.'}});
        return json(res, 200, {products: PUBLIC_PRODUCTS, currency: 'BRL'});
      }

      if (pathname === '/api/checkout/quote') {
        if (req.method !== 'POST') return json(res, 405, {error: {code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.'}});
        const input = await readJsonBody(req);
        const {gross, cashbackRate = 0, cashbackUsed = 0} = input;
        if (!Number.isFinite(gross) || gross < 0) throw new Error('INVALID_MONEY');
        if (!Number.isFinite(cashbackRate) || cashbackRate < 0 || cashbackRate > 1) throw new Error('INVALID_RATE');
        const allocation = calculateAllocation({gross, cashbackRate, cashbackUsed});
        return json(res, 200, {allocation, provider: 'mock', currency: 'BRL'});
      }

      if (pathname === '/api/session' && req.method === 'GET') {
        if (bearer(req)) return apiError(res, 400, 'USE_MOBILE_SESSION_ENDPOINT');
        const session = webSession(req, {create: true});
        return json(res, 200, {session: publicSession(session), legalVersion: LEGAL_VERSION}, {'set-cookie': setSessionCookie(session, req)});
      }

      if (pathname === '/api/mobile/session' && req.method === 'GET') {
        if (!bearer(req) && parseCookies(req).life_session) return apiError(res, 400, 'USE_WEB_SESSION_ENDPOINT');
        const session = mobileSession(req, {create: true});
        if (!session) return apiError(res, 401, 'INVALID_SESSION', 'Sessão mobile inválida.');
        return json(res, 200, {session: publicSession(session), legalVersion: LEGAL_VERSION, sessionToken: session.token});
      }

      if (pathname === '/api/legal/accept' && req.method === 'POST') {
        if (!requireSameOriginForCookie(req, res)) return;
        const session = requireSession(req, res);
        if (!session) return;
        const input = await readJsonBody(req);
        if (!exactObject(input, ['version']) || input.version !== LEGAL_VERSION) return apiError(res, 422, 'INVALID_LEGAL_VERSION');
        session.legalAcceptedVersion = LEGAL_VERSION;
        return json(res, 200, {session: publicSession(session)});
      }

      if (pathname === '/api/checkout/commit' && req.method === 'POST') {
        if (!requireSameOriginForCookie(req, res)) return;
        if (!checkRate(req, 'checkout', 30, 60_000)) return apiError(res, 429, 'CHECKOUT_RATE_LIMITED', 'Limite temporário de checkout atingido.');
        const session = requireSession(req, res);
        if (!session || !requireLegal(session, res) || !requireRole(session, res, 'resident')) return;
        const idempotencyKey = String(req.headers['idempotency-key'] || '');
        if (!/^[A-Za-z0-9._:-]{16,128}$/.test(idempotencyKey)) return apiError(res, 400, 'INVALID_IDEMPOTENCY_KEY');
        const input = await readJsonBody(req);
        if (!exactObject(input, ['productId', 'useCashback']) || typeof input.productId !== 'string' || typeof input.useCashback !== 'boolean') {
          return apiError(res, 422, 'INVALID_CHECKOUT_INPUT');
        }
        const fingerprint = `${input.productId}:${input.useCashback ? '1' : '0'}`;
        const previous = session.idempotency.get(idempotencyKey);
        if (previous) {
          if (previous.fingerprint !== fingerprint) return apiError(res, 409, 'IDEMPOTENCY_KEY_REUSED', 'A chave de idempotência já foi usada com outra operação.');
          return json(res, 200, previous.payload);
        }
        const product = DEMO_PRODUCTS[input.productId];
        if (!product) return apiError(res, 404, 'PRODUCT_NOT_FOUND');
        const cashbackUsedCents = input.useCashback ? Math.min(session.cashbackCents, Math.floor(product.priceCents / 2)) : 0;
        const allocation = allocationCents(calculateAllocation({
          gross: product.priceCents / 100,
          cashbackRate: product.cashbackBps / 10_000,
          cashbackUsed: cashbackUsedCents / 100,
          cashbackBalance: session.cashbackCents / 100,
        }));
        session.cashbackCents = session.cashbackCents - allocation.cashbackUsedCents + allocation.cashbackEarnedCents;
        session.orders += 1;
        session.condoRevenueCents += allocation.condominiumShareCents;
        const payload = {allocation, session: publicSession(session), provider: 'mock', currency: 'BRL', productId: product.id};
        session.idempotency.set(idempotencyKey, {fingerprint, payload});
        if (session.idempotency.size > 100) session.idempotency.delete(session.idempotency.keys().next().value);
        return json(res, 200, payload);
      }

      if (pathname.startsWith('/api/')) return apiError(res, 404, 'NOT_FOUND', 'Não encontrado.');
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        writeHead(res, 405, {allow: 'GET, HEAD'});
        return res.end();
      }

      const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
      const file = resolve(root, requested);
      const relativePath = relative(rootResolved, file);
      if (relativePath.startsWith('..') || relativePath.includes('\0')) throw new Error('NOT_FOUND');
      let staticFile = file;
      try {
        if ((await stat(staticFile)).isDirectory()) staticFile = join(staticFile, 'index.html');
      } catch {
        throw new Error('NOT_FOUND');
      }
      const content = await readFile(staticFile);
      writeHead(res, 200, {'content-type': types[extname(staticFile)] || 'application/octet-stream', 'cache-control': extname(staticFile) === '.html' ? 'no-store' : 'no-cache'});
      if (req.method === 'HEAD') return res.end();
      return res.end(content);
    } catch (error) {
      const status = Number(error?.status) || (pathname.startsWith('/api/') ? 400 : 500);
      const code = status >= 500 ? 'INTERNAL_ERROR' : String(error?.message || 'BAD_REQUEST');
      if (pathname.startsWith('/api/')) return apiError(res, status, code);
      try {
        const content = await readFile(join(root, 'index.html'));
        writeHead(res, 200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'});
        return res.end(content);
      } catch {
        return apiError(res, 500, 'INTERNAL_ERROR');
      }
    }
  });
}

export { calculateAllocation };

export function startServer({port = Number(process.env.PORT || 4173), host = process.env.LIFE_BIND_HOST || '127.0.0.1'} = {}) {
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) throw new Error('INVALID_PORT');
  const server = createApp();
  return server.listen(port, host, () => console.log(`Life MVP demo: http://${host}:${port}`));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.env.NODE_ENV === 'production') throw new Error('PROTOTYPE_SERVER_DISABLED_IN_PRODUCTION');
  if ((process.env.PAYMENT_PROVIDER || 'mock') !== 'mock') throw new Error('PROTOTYPE_ONLY_SUPPORTS_MOCK_PAYMENTS');
  startServer();
}
