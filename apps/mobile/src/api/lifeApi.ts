import * as SecureStore from 'expo-secure-store';

const SESSION_KEY='life.session-token';
const API_URL=(process.env.EXPO_PUBLIC_API_URL||'http://127.0.0.1:4173').replace(/\/$/,'');

export type ServerSession={
  role:'resident';
  cashbackCents:number;
  orders:number;
  condoRevenueCents:number;
  legalAcceptedVersion:string|null;
};

type SessionResponse={session:ServerSession;legalVersion:string;sessionToken?:string};

async function token(){return SecureStore.getItemAsync(SESSION_KEY)}
async function clearToken(){await SecureStore.deleteItemAsync(SESSION_KEY)}

async function fetchJson<T>(path:string,init:RequestInit={},sessionToken?:string|null):Promise<T>{
  const headers:Record<string,string>={...(init.body?{'content-type':'application/json'}:{}),...((init.headers||{}) as Record<string,string>)};
  if(sessionToken)headers.authorization=`Bearer ${sessionToken}`;
  const response=await fetch(`${API_URL}${path}`,{...init,headers});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    const error=new Error(payload?.error?.code||'REQUEST_FAILED') as Error&{status?:number};
    error.status=response.status;
    throw error;
  }
  return payload as T;
}

async function createSession():Promise<SessionResponse>{
  const payload=await fetchJson<SessionResponse>('/api/session',{headers:{'x-life-client':'mobile'}});
  if(!payload.sessionToken)throw new Error('SESSION_TOKEN_MISSING');
  await SecureStore.setItemAsync(SESSION_KEY,payload.sessionToken,{keychainAccessible:SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY});
  return payload;
}

export async function bootstrapSession():Promise<SessionResponse>{
  const saved=await token();
  if(!saved)return createSession();
  try{return await fetchJson<SessionResponse>('/api/session',{},saved)}
  catch(error){
    if((error as Error&{status?:number}).status!==401)throw error;
    await clearToken();
    return createSession();
  }
}

export async function acceptLegalVersion(version:string):Promise<ServerSession>{
  const saved=await token();
  if(!saved)throw new Error('UNAUTHENTICATED');
  const payload=await fetchJson<{session:ServerSession}>('/api/legal/accept',{method:'POST',body:JSON.stringify({version})},saved);
  return payload.session;
}

export async function checkoutProduct(productId:string,useCashback:boolean,idempotencyKey:string):Promise<{session:ServerSession;allocation:{customerPayableCents:number;cashbackUsedCents:number;cashbackEarnedCents:number;condominiumShareCents:number}}>{
  const saved=await token();
  if(!saved)throw new Error('UNAUTHENTICATED');
  return fetchJson('/api/checkout/quote',{method:'POST',headers:{'idempotency-key':idempotencyKey},body:JSON.stringify({productId,useCashback})},saved);
}
