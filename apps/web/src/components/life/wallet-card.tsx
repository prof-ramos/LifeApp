import { ArrowUpRight, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const brl = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function WalletCard({ balance }: { balance: number }) {
  return (
    <Card className="relative overflow-hidden bg-card-elevated p-6 md:p-7">
      <div className="absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><WalletCards className="size-4 text-primary" /> Life Wallet</div>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Crédito promocional</span>
        </div>
        <p className="text-sm font-bold text-muted-foreground">Disponível para usar</p>
        <p className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-5xl">{brl(balance)}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="lg">Usar cashback <ArrowUpRight className="size-4" /></Button>
          <p className="max-w-xs text-xs leading-5 text-muted-foreground">O saldo final é validado pelo backend antes de qualquer transação real.</p>
        </div>
      </div>
    </Card>
  );
}
