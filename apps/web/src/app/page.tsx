import type { LucideIcon } from 'lucide-react';
import { Bell, Building2, CalendarDays, ChevronRight, Home, Package, Scissors, Search, ShieldCheck, ShoppingBag, Sparkles, Store, Users, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { MerchantCard } from '@/components/life/merchant-card';
import { WalletCard } from '@/components/life/wallet-card';

const merchants = [
  { name: 'Casa Verde Market', category: 'Mercado', rating: 4.9, cashback: 8, item: 'Cesta Fresh', price: 64.9, icon: Store },
  { name: 'Studio Nômade', category: 'Beleza', rating: 4.8, cashback: 12, item: 'Corte Premium', price: 55, icon: Scissors },
  { name: 'Resolve Casa', category: 'Serviços', rating: 4.9, cashback: 10, item: 'Visita técnica', price: 79.9, icon: Wrench },
] satisfies Array<{ name:string; category:string; rating:number; cashback:number; item:string; price:number; icon:LucideIcon }>;

const quickActions = [
  { title:'Encomenda', sub:'1 aguardando', icon:Package },
  { title:'Visitante', sub:'Gerar acesso', icon:ShieldCheck },
  { title:'Reservar', sub:'Áreas comuns', icon:CalendarDays },
  { title:'Comunidade', sub:'Ver novidades', icon:Users },
] satisfies Array<{ title:string; sub:string; icon:LucideIcon }>;

const navItems = [
  { label:'Início', icon:Home },
  { label:'Comunidade', icon:Users },
  { label:'Comprar', icon:ShoppingBag },
  { label:'Condomínio', icon:Building2 },
  { label:'Perfil', icon:Package },
] satisfies Array<{ label:string; icon:LucideIcon }>;

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-[1180px] px-screen pb-28 pt-5 md:pb-12">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-md bg-primary font-black text-primary-foreground">L</div><div><strong className="tracking-[.18em]">LIFE</strong><p className="text-xs text-muted-foreground">Life Residence</p></div></div>
        <div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Buscar"><Search className="size-5" /></Button><Button variant="ghost" size="icon" aria-label="Notificações"><Bell className="size-5" /></Button><div className="grid size-11 place-items-center rounded-full bg-secondary text-sm font-black">GR</div></div>
      </header>

      <section className="mb-9 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <WalletCard balance={27.8} />
        <Card className="flex flex-col justify-between bg-card-elevated">
          <div><div className="mb-4 flex items-center gap-2 text-primary"><Sparkles className="size-4" /><span className="text-xs font-black uppercase tracking-[.16em]">Insight de hoje</span></div><CardTitle>Seu cashback rende mais em serviços de casa.</CardTitle><CardDescription className="mt-3">A Resolve Casa está perto, tem reputação 4,9 e oferece 10% de cashback.</CardDescription></div>
          <Button variant="outline" className="mt-6 justify-between">Ver recomendação <ChevronRight className="size-4" /></Button>
        </Card>
      </section>

      <section className="mb-9">
        <p className="text-xs font-black uppercase tracking-[.16em] text-primary">Seu condomínio</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">O que você precisa, sem burocracia.</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{quickActions.map(({title,sub,icon:Icon})=><Card key={title} className="p-4"><Icon className="mb-5 size-5 text-primary" /><p className="font-black">{title}</p><p className="mt-1 text-xs text-muted-foreground">{sub}</p></Card>)}</div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Perto de você</p><h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">Comprar no Life</h2></div><Button variant="ghost">Ver tudo <ChevronRight className="size-4" /></Button></div>
        <div className="grid gap-3 md:grid-cols-3">{merchants.map(({icon:Icon,...merchant})=><MerchantCard key={merchant.name} {...merchant} icon={<Icon className="size-6" />} />)}</div>
      </section>

      <nav className="fixed bottom-3 left-1/2 z-20 flex w-[calc(100%-24px)] max-w-xl -translate-x-1/2 items-center justify-around rounded-xl border border-border bg-card/95 p-2 shadow-life backdrop-blur md:static md:mx-auto md:mt-10 md:w-auto md:translate-x-0">
        {navItems.map(({icon:Icon,label},index)=><button key={label} className={`flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-md px-3 text-[10px] font-bold ${index===0?'bg-primary/10 text-primary':'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className="size-4" />{label}</button>)}
      </nav>
    </main>
  );
}
