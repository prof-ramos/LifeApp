import { Text, View } from 'react-native';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { CashbackBadge } from './cashback-badge';

const brl=(value:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);

export function MerchantCard({ emoji,name,category,rating,item,price,cashback,redeemed=0,processing=false,onBuy }: { emoji:string; name:string; category:string; rating:number; item:string; price:number; cashback:number; redeemed?:number; processing?:boolean; onBuy:()=>void }) {
  return <Card className="mb-3"><View className="mb-5 flex-row items-start justify-between"><View className="h-12 w-12 items-center justify-center rounded-md bg-secondary"><Text className="text-2xl">{emoji}</Text></View><CashbackBadge rate={cashback}/></View><Text className="text-lg font-black text-foreground">{name}</Text><Text className="mt-1 text-xs text-muted-foreground">{category} · ★ {rating}</Text><View className="my-5"><Text className="text-sm text-muted-foreground">{item}</Text><Text className="mt-1 text-xl font-black text-foreground">{brl(price)}</Text></View>{redeemed>0?<Text className="mb-2 text-xs font-bold text-primary">Cashback aplicado: {brl(redeemed)} · pagar {brl(price-redeemed)}</Text>:null}<Button disabled={processing} onPress={onBuy}>{processing?'Processando…':'Comprar no Life'}</Button></Card>;
}
