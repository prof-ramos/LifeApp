import type { ReactNode } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CashbackBadge } from './cashback-badge';

const brl = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function MerchantCard({ icon, name, category, rating, item, price, cashback }: { icon: ReactNode; name: string; category: string; rating: number; item: string; price: number; cashback: number }) {
  return (
    <Card className="group flex min-h-64 flex-col justify-between transition hover:-translate-y-1 hover:border-primary/30">
      <div>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="grid size-12 place-items-center rounded-md bg-secondary text-primary">{icon}</div>
          <CashbackBadge rate={cashback} />
        </div>
        <h3 className="text-lg font-black">{name}</h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><span>{category}</span><span>•</span><span className="flex items-center gap-1"><Star className="size-3 fill-current text-warning" /> {rating}</span></div>
        <p className="mt-5 text-sm text-muted-foreground">{item}</p>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <strong className="text-xl tracking-tight">{brl(price)}</strong>
        <Button variant="ghost" size="icon" aria-label={`Abrir ${name}`}><ArrowRight className="size-5" /></Button>
      </div>
    </Card>
  );
}
