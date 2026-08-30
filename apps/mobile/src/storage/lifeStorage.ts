import Storage from 'expo-sqlite/kv-store';

// SQLite é somente cache de apresentação/offline. Nunca autoriza compra, saldo,
// cashback, papel de usuário ou aceite jurídico. O servidor sempre prevalece.
const KEYS={
  cashbackCents:'life.cache.cashbackCents',
  orders:'life.cache.orders',
  legalAcceptedVersion:'life.cache.legalAcceptedVersion',
} as const;

export type LocalLifeCache={cashbackCents:number;orders:number;legalAcceptedVersion:string|null};
const EMPTY_CACHE:LocalLifeCache={cashbackCents:0,orders:0,legalAcceptedVersion:null};

export async function loadLocalLifeCache():Promise<LocalLifeCache>{
  const [cashbackRaw,ordersRaw,legalAcceptedVersion]=await Promise.all([
    Storage.getItem(KEYS.cashbackCents),Storage.getItem(KEYS.orders),Storage.getItem(KEYS.legalAcceptedVersion),
  ]);
  const cashbackCents=cashbackRaw===null?0:Number(cashbackRaw);
  const orders=ordersRaw===null?0:Number(ordersRaw);
  return {
    cashbackCents:Number.isSafeInteger(cashbackCents)&&cashbackCents>=0?cashbackCents:EMPTY_CACHE.cashbackCents,
    orders:Number.isSafeInteger(orders)&&orders>=0?orders:EMPTY_CACHE.orders,
    legalAcceptedVersion,
  };
}

export async function saveLocalLifeCache(cache:LocalLifeCache):Promise<void>{
  await Promise.all([
    Storage.setItem(KEYS.cashbackCents,String(cache.cashbackCents)),
    Storage.setItem(KEYS.orders,String(cache.orders)),
    cache.legalAcceptedVersion===null?Storage.removeItem(KEYS.legalAcceptedVersion):Storage.setItem(KEYS.legalAcceptedVersion,cache.legalAcceptedVersion),
  ]);
}
