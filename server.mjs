import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { calculateAllocation } from './prototype/finance.js';
import { DEMO_PRODUCTS, PUBLIC_PRODUCTS } from './prototype/catalog.js';

const NODE_ENV=process.env.NODE_ENV||'development';
const PAYMENT_PROVIDER=process.env.PAYMENT_PROVIDER||'mock';
if(NODE_ENV==='production')throw new Error('PROTOTYPE_SERVER_DISABLED_IN_PRODUCTION');
if(PAYMENT_PROVIDER!=='mock')throw new Error('PROTOTYPE_ONLY_SUPPORTS_MOCK_PAYMENTS');

const LEGAL_VERSION='2026-08-30';
const root=resolve(process.cwd(),'prototype');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.json':'application/json'};
const sessions=new Map();
const rateBuckets=new Map();
const MAX_BODY_BYTES=16_384;
const SESSION_TTL_MS=24*60*60*1000;
const MAX_SESSIONS=1000;
const MAX_RATE_BUCKETS=2000;

const securityHeaders={
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'permissions-policy':'camera=(), microphone=(), geolocation=()',
  'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'cross-origin-opener-policy':'same-origin',
};
const writeHead=(res,status,headers={})=>res.writeHead(status,{...securityHeaders,...headers});
const json=(res,status,data,headers={})=>{writeHead(res,status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers});res.end(JSON.stringify(data))};
const apiError=(res,status,code,message='Não foi possível processar a solicitação.')=>json(res,status,{error:{code,message}});

function parseCookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return i<0?[v,'']:[v.slice(0,i),decodeURIComponent(v.slice(i+1))]}))}
function bearer(req){const h=req.headers.authorization||'';return h.startsWith('Bearer ')?h.slice(7):null}
function cleanupSessions(){const now=Date.now();for(const [token,s] of sessions){if(now-s.createdAt>SESSION_TTL_MS)sessions.delete(token)}while(sessions.size>=MAX_SESSIONS)sessions.delete(sessions.keys().next().value)}
function newSession(){cleanupSessions();const token=randomUUID();const session={token,role:'resident',cashbackCents:2780,orders:0,condoRevenueCents:0,legalAcceptedVersion:null,createdAt:Date.now(),idempotency:new Map()};sessions.set(token,session);return session}
function getSession(req,{create=false}={}){
  const bearerToken=bearer(req);
  const cookieToken=parseCookies(req).life_session;
  const token=bearerToken||cookieToken;
  let session=token?sessions.get(token):null;
  if(session&&Date.now()-session.createdAt>SESSION_TTL_MS){sessions.delete(token);session=null}
  if(session)return session;
  // Bearer tokens are explicit credentials: never silently replace an invalid one.
  if(bearerToken)return null;
  return create?newSession():null;
}
function publicSession(session){return {role:session.role,cashbackCents:session.cashbackCents,orders:session.orders,condoRevenueCents:session.condoRevenueCents,legalAcceptedVersion:session.legalAcceptedVersion}}
function setSessionCookie(session){return `life_session=${encodeURIComponent(session.token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`}
function clientIp(req){return String(req.socket.remoteAddress||'unknown')}
function cleanupRateBuckets(now,windowMs){if(rateBuckets.size<MAX_RATE_BUCKETS)return;for(const [key,bucket] of rateBuckets){if(now-bucket.start>=windowMs)rateBuckets.delete(key)}while(rateBuckets.size>=MAX_RATE_BUCKETS)rateBuckets.delete(rateBuckets.keys().next().value)}
function checkRate(req,key,limit,windowMs){const bucketKey=`${clientIp(req)}:${key}`;const now=Date.now();cleanupRateBuckets(now,windowMs);const prev=rateBuckets.get(bucketKey);if(!prev||now-prev.start>=windowMs){rateBuckets.set(bucketKey,{start:now,count:1});return true}if(prev.count>=limit)return false;prev.count+=1;return true}
async function readJson(req){if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json')){const e=new Error('UNSUPPORTED_MEDIA_TYPE');e.status=415;throw e}let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>MAX_BODY_BYTES){const e=new Error('PAYLOAD_TOO_LARGE');e.status=413;throw e}}try{return raw?JSON.parse(raw):{}}catch{const e=new Error('INVALID_JSON');e.status=400;throw e}}
function exactObject(input,keys){if(!input||typeof input!=='object'||Array.isArray(input))return false;const actual=Object.keys(input).sort();const expected=[...keys].sort();return actual.length===expected.length&&actual.every((k,i)=>k===expected[i])}
function requireSession(req,res){const session=getSession(req);if(!session){apiError(res,401,'UNAUTHENTICATED','Sessão necessária.');return null}return session}
function requireLegal(session,res){if(session.legalAcceptedVersion!==LEGAL_VERSION){apiError(res,403,'LEGAL_ACCEPTANCE_REQUIRED','Aceite a versão jurídica vigente antes de continuar.');return false}return true}
function requireSameOriginForCookie(req,res){if(bearer(req))return true;const origin=req.headers.origin;if(!origin){apiError(res,403,'ORIGIN_REQUIRED');return false}let expected;try{expected=new URL(origin);const host=String(req.headers.host||'');if(expected.host!==host){apiError(res,403,'ORIGIN_MISMATCH');return false}}catch{apiError(res,403,'INVALID_ORIGIN');return false}return true}

const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
    const pathname=decodeURIComponent(url.pathname);

    if(pathname.startsWith('/api/')&&!checkRate(req,'api',120,60_000))return apiError(res,429,'RATE_LIMITED','Muitas solicitações. Tente novamente em instantes.');
    if(pathname==='/api/health'&&req.method==='GET')return json(res,200,{status:'ok',service:'life-mvp',mode:'demo',time:new Date().toISOString()});
    if(pathname==='/api/catalog'&&req.method==='GET')return json(res,200,{products:PUBLIC_PRODUCTS,currency:'BRL'});
    if(pathname==='/api/session'&&req.method==='GET'){
      const session=getSession(req,{create:true});
      if(!session)return apiError(res,401,'INVALID_SESSION','Sessão expirada ou inválida.');
      const headers={'set-cookie':setSessionCookie(session)};
      const response={session:publicSession(session),legalVersion:LEGAL_VERSION};
      if(req.headers['x-life-client']==='mobile')response.sessionToken=session.token;
      return json(res,200,response,headers);
    }
    if(pathname==='/api/legal/accept'&&req.method==='POST'){
      if(!requireSameOriginForCookie(req,res))return;
      const session=requireSession(req,res);if(!session)return;
      const input=await readJson(req);
      if(!exactObject(input,['version'])||input.version!==LEGAL_VERSION)return apiError(res,422,'INVALID_LEGAL_VERSION');
      session.legalAcceptedVersion=LEGAL_VERSION;
      return json(res,200,{session:publicSession(session)});
    }
    if(pathname==='/api/checkout/commit'&&req.method==='POST'){
      if(!requireSameOriginForCookie(req,res))return;
      if(!checkRate(req,'checkout',12,60_000))return apiError(res,429,'CHECKOUT_RATE_LIMITED','Limite temporário de checkout atingido.');
      const session=requireSession(req,res);if(!session||!requireLegal(session,res))return;
      const idempotencyKey=String(req.headers['idempotency-key']||'');
      if(!/^[A-Za-z0-9._:-]{16,128}$/.test(idempotencyKey))return apiError(res,400,'INVALID_IDEMPOTENCY_KEY');
      const input=await readJson(req);
      if(!exactObject(input,['productId','useCashback'])||typeof input.productId!=='string'||typeof input.useCashback!=='boolean')return apiError(res,422,'INVALID_CHECKOUT_INPUT');
      const fingerprint=`${input.productId}:${input.useCashback?'1':'0'}`;
      const previous=session.idempotency.get(idempotencyKey);
      if(previous){
        if(previous.fingerprint!==fingerprint)return apiError(res,409,'IDEMPOTENCY_KEY_REUSED','A chave de idempotência já foi usada com outra operação.');
        return json(res,200,previous.payload);
      }
      const product=DEMO_PRODUCTS[input.productId];
      if(!product)return apiError(res,404,'PRODUCT_NOT_FOUND');
      const cashbackUsedCents=input.useCashback?Math.min(session.cashbackCents,Math.floor(product.priceCents/2)):0;
      const allocation=calculateAllocation({grossCents:product.priceCents,cashbackBps:product.cashbackBps,cashbackUsedCents});
      session.cashbackCents=session.cashbackCents-allocation.cashbackUsedCents+allocation.cashbackEarnedCents;
      session.orders+=1;
      session.condoRevenueCents+=allocation.condominiumShareCents;
      const payload={allocation,session:publicSession(session),provider:'mock',currency:'BRL',productId:product.id};
      session.idempotency.set(idempotencyKey,{fingerprint,payload});
      if(session.idempotency.size>100)session.idempotency.delete(session.idempotency.keys().next().value);
      return json(res,200,payload);
    }
    if(pathname.startsWith('/api/'))return apiError(res,404,'NOT_FOUND','Endpoint não encontrado.');
    if(req.method!=='GET'&&req.method!=='HEAD'){writeHead(res,405,{'allow':'GET, HEAD'});return res.end()}

    const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
    const normalized=normalize(relative);
    if(isAbsolute(normalized)||normalized==='..'||normalized.startsWith(`..${sep}`))return apiError(res,404,'NOT_FOUND');
    let file=resolve(root,normalized);
    if(file!==root&&!file.startsWith(`${root}${sep}`))return apiError(res,404,'NOT_FOUND');
    try{if((await stat(file)).isDirectory())file=join(file,'index.html')}catch{}
    const content=await readFile(file);
    writeHead(res,200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':extname(file)==='.html'?'no-store':'no-cache'});
    if(req.method==='HEAD')return res.end();
    res.end(content);
  }catch(err){
    const status=Number(err?.status)||500;
    const code=status>=500?'INTERNAL_ERROR':String(err?.message||'BAD_REQUEST');
    if((req.url||'').startsWith('/api/'))return apiError(res,status,code);
    try{const content=await readFile(join(root,'index.html'));writeHead(res,status>=500?500:404,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(content)}catch{return apiError(res,500,'INTERNAL_ERROR')}
  }
});
server.requestTimeout=10_000;
server.headersTimeout=5_000;
server.keepAliveTimeout=5_000;
server.maxRequestsPerSocket=100;
server.listen(4173,'127.0.0.1',()=>console.log('Life MVP demo: http://127.0.0.1:4173'));
