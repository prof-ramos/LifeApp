import { Text, View } from 'react-native';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const brl=(value:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);

export function WalletCard({ balance, onUseCashback }: { balance:number; onUseCashback:()=>void }) {
  return <Card className="overflow-hidden bg-card-elevated p-6"><View className="mb-8 flex-row items-center justify-between"><Text className="text-sm font-bold text-muted-foreground">Life Wallet</Text><Text className="text-xs font-bold text-primary">crédito promocional</Text></View><Text className="text-sm font-bold text-muted-foreground">Disponível para usar</Text><Text className="mt-2 text-4xl font-black tracking-tighter text-foreground">{brl(balance)}</Text><Button className="mt-6" onPress={onUseCashback}>Usar cashback</Button></Card>;
}
