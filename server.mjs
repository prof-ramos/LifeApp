import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateAllocation } from './prototype/finance.js';

const root = fileURLToPath(new URL('./prototype/', import.meta.url));
const rootResolved = resolve(root);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

const MAX_BODY_BYTES = 64_000;

const json = (res, status, data) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(data));
};

const readJsonBody = async req => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('INVALID_JSON');
  }
};

const apiError = (res, error) => {
  const status = error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
  return json(res, status, {
    error: {code: error.message || 'BAD_REQUEST', message: 'Não foi possível processar a solicitação.'},
  });
};

const safeStaticFile = async pathname => {
  const path = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = resolve(root, path);
  const relativePath = relative(rootResolved, file);
  if (relativePath.startsWith('..') || relativePath.includes('\0')) throw new Error('NOT_FOUND');
  try {
    if ((await stat(file)).isDirectory()) return join(file, 'index.html');
    return file;
  } catch {
    throw new Error('NOT_FOUND');
  }
};

export function createApp() {
  return createServer(async (req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      return json(res, 400, {error: {code: 'INVALID_URL', message: 'Não foi possível processar a solicitação.'}});
    }

    try {
      if (pathname === '/api/health') {
        if (req.method !== 'GET') return json(res, 405, {error: {code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.'}});
        return json(res, 200, {status: 'ok', service: 'life-mvp', time: new Date().toISOString()});
      }

      if (pathname === '/api/checkout/quote') {
        if (req.method !== 'POST') return json(res, 405, {error: {code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.'}});
        const input = await readJsonBody(req);
        const { gross, cashbackRate = 0, cashbackUsed = 0 } = input;

        if (!Number.isFinite(gross) || gross < 0) throw new Error('INVALID_MONEY');
        if (!Number.isFinite(cashbackRate) || cashbackRate < 0 || cashbackRate > 1) throw new Error('INVALID_RATE');

        const allocation = calculateAllocation({ gross, cashbackRate, cashbackUsed });
        return json(res, 200, {allocation, provider: 'mock', currency: 'BRL'});
      }

      if (pathname.startsWith('/api/')) return json(res, 404, {error: {code: 'NOT_FOUND', message: 'Não encontrado.'}});

      const file = await safeStaticFile(pathname);
      const content = await readFile(file);
      res.writeHead(200, {'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache'});
      return res.end(content);
    } catch (error) {
      if (pathname.startsWith('/api/')) return apiError(res, error);
      const content = await readFile(join(root, 'index.html'));
      res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
      return res.end(content);
    }
  });
}

export { calculateAllocation };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createApp().listen(4173, '0.0.0.0', () => console.log('Life MVP: http://localhost:4173'));
}
