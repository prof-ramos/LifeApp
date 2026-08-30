import './global.css';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {SafeAreaView,ScrollView,Text,Pressable,View} from 'react-native';
import {acceptLegalVersion,bootstrapSession,checkoutProduct,type ServerSession} from './src/api/lifeApi';
import {loadLocalLifeCache,saveLocalLifeCache} from './src/storage/lifeStorage';
import {Button} from './src/components/ui/button';
import {Card,CardDescription,CardTitle} from './src/components/ui/card';
import {MerchantCard} from './src/components/life/merchant-card';
import {WalletCard} from './src/components/life/wallet-card';

type Tab='home'|'market'|'social'|'insights'|'profile';
type Merchant={id:string;name:string;category:string;rating:number;cashback:number;emoji:string;item:string;priceCents:number};
const LEGAL_VERSION='2026-08-30';
const merchants:Merchant[]=[
  {id:'cesta-fresh',name:'Casa Verde Market',category:'Mercado',rating:4.9,cashback:8,emoji:'🥬',item:'Cesta Fresh',priceCents:6490},
  {id:'corte-premium',name:'Studio Nômade',category:'Beleza',rating:4.8,cashback:12,emoji:'✂️',item:'Corte Premium',priceCents:5500},
  {id:'visita-tecnica',name:'Resolve Casa',category:'Serviços',rating:4.9,cashback:10,emoji:'🛠️',item:'Visita técnica',priceCents:7990},
];
const brl=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
const idempotencyKey=()=>globalThis.crypto?.randomUUID?.()||`mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function App(){
  const [tab,setTab]=useState<Tab>('home');
  const [session,setSession]=useState<ServerSession|null>(null);
  const [hydrated,setHydrated]=useState(false);
  const [connectionError,setConnectionError]=useState('');
  const [useCashback,setUseCashback]=useState(false);
  const [isPurchasing,setIsPurchasing]=useState(false);
  const [message,setMessage]=useState('');
  const purchaseLock=useRef(false);

  const sync=async()=>{
    try{
      const payload=await bootstrapSession();
      setSession(payload.session);setConnectionError('');
      await saveLocalLifeCache(payload.session);
    }catch{
      // Cache pode ser lido para futura UX offline, mas não habilita operações protegidas.
      await loadLocalLifeCache().catch(()=>null);
      setSession(null);setConnectionError('Conexão com o backend é necessária para validar sessão, saldo e documentos.');
    }finally{setHydrated(true)}
  };
  useEffect(()=>{void sync()},[]);

  const acceptLegal=async()=>{
    try{const next=await acceptLegalVersion(LEGAL_VERSION);setSession(next);await saveLocalLifeCache(next)}
    catch{setMessage('Não foi possível registrar o aceite no servidor.')}
  };
  const buy=async(m:Merchant)=>{
    if(purchaseLock.current||!session)return;
    purchaseLock.current=true;setIsPurchasing(true);
    try{
      const payload=await checkoutProduct(m.id,useCashback,idempotencyKey());
      setSession(payload.session);setUseCashback(false);await saveLocalLifeCache(payload.session);
      const a=payload.allocation;
      setMessage(`Pagamento MVP aprovado: ${brl(a.customerPayableCents)} · cashback usado ${brl(a.cashbackUsedCents)} · ganho ${brl(a.cashbackEarnedCents)}.`);
    }catch{setMessage('Compra não concluída. O backend não autorizou a operação.')}
    finally{purchaseLock.current=false;setIsPurchasing(false)}
  };

  const content=useMemo(()=>{
    if(!session)return null;
    if(tab==='market')return <><SectionTitle eyebrow="Perto de você" title="Marketplace" sub="Preço, cashback e saldo são validados pelo backend."/><Card className="mb-4 bg-card-elevated"><View className="flex-row items-center justify-between"><View><CardTitle>Life Wallet</CardTitle><Text className="mt-1 text-3xl font-black text-foreground">{brl(session.cashbackCents)}</Text></View><Button variant={useCashback?'outline':'default'} onPress={()=>setUseCashback(v=>!v)}>{useCashback?'Remover':'Aplicar'}</Button></View><CardDescription className="mt-3">A estimativa local é apenas visual; o backend recalcula o checkout.</CardDescription></Card>{merchants.map(m=><MerchantCard key={m.id} {...m} price={m.priceCents/100} redeemed={useCashback?Math.min(session.cashbackCents,m.priceCents/2)/100:0} processing={isPurchasing} onBuy={()=>void buy(m)}/>)}</>;
    if(tab==='social')return <><SectionTitle eyebrow="Comunidade" title="O que está acontecendo" sub="Experiências locais e avaliações verificadas."/><Card><CardTitle>Marina S. · ★★★★★</CardTitle><CardDescription className="mt-2">Usei a Resolve Casa hoje. Atendimento pontual e serviço concluído rapidamente.</CardDescription><Text className="mt-4 text-xs font-black text-primary">COMPRA VERIFICADA</Text></Card></>;
    if(tab==='insights')return <><SectionTitle eyebrow="Seu dinheiro" title="Insights" sub="Gastos transformados em decisões simples."/><View className="mb-1 flex-row flex-wrap justify-between"><Metric label="Gastos" value={brl(104000)}/><Metric label="Cashback" value={brl(session.cashbackCents)}/><Metric label="Pedidos" value={String(9+session.orders)}/><Metric label="Economia" value={brl(8640)}/></View><Card className="bg-card-elevated"><Text className="text-xs font-black uppercase tracking-widest text-primary">Melhor uso</Text><CardTitle className="mt-3">Serviços residenciais combinam com seu histórico.</CardTitle><CardDescription className="mt-2">A Resolve Casa tem 10% de cashback e boa reputação perto de você.</CardDescription><Button className="mt-5" onPress={()=>{setUseCashback(true);setTab('market')}}>Usar cashback</Button></Card></>;
    if(tab==='profile')return <><SectionTitle eyebrow="Sua conta" title="Perfil" sub="Privacidade e controle sem expor dados condominiais."/><WalletCard balance={session.cashbackCents/100} onUseCashback={()=>{setUseCashback(true);setTab('market')}}/><Card className="mt-3"><CardTitle>Documentos legais</CardTitle><CardDescription className="mt-2">Versão validada pelo backend: {session.legalAcceptedVersion}</CardDescription></Card></>;
    return <><Text className="mb-2 text-xs font-black uppercase tracking-widest text-primary">Seu dia no Life</Text><Text className="mb-6 text-4xl font-black tracking-tighter text-foreground">Boa noite.{`\n`}Tudo perto de você.</Text><WalletCard balance={session.cashbackCents/100} onUseCashback={()=>{setUseCashback(true);setTab('market')}}/><SectionTitle eyebrow="Seu condomínio" title="Ações rápidas" sub="O essencial sem menus complexos."/><View className="flex-row flex-wrap justify-between"><Metric label="📦 Encomenda" value="1 aguardando"/><Metric label="🔑 Visitante" value="Gerar acesso"/><Metric label="🛍️ Comprar" value="Marketplace"/><Metric label="↗ Insights" value="Economizar"/></View></>;
  },[tab,session,useCashback,isPurchasing]);

  if(!hydrated)return <SafeAreaView className="flex-1 items-center justify-center bg-background"><Text className="text-xl font-black tracking-widest text-foreground">LIFE</Text><Text className="mt-2 text-sm text-muted-foreground">Validando sessão…</Text></SafeAreaView>;
  if(connectionError||!session)return <SafeAreaView className="flex-1 bg-background"><View className="flex-1 justify-center px-6"><Text className="text-xs font-black uppercase tracking-widest text-primary">Segurança</Text><Text className="mt-3 text-3xl font-black text-foreground">Conexão segura necessária</Text><Text className="mt-4 text-muted-foreground">{connectionError}</Text><Button className="mt-8" onPress={()=>void sync()}>Tentar novamente</Button></View></SafeAreaView>;
  if(session.legalAcceptedVersion!==LEGAL_VERSION)return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10"><Text className="text-xs font-black uppercase tracking-widest text-primary">Privacidade e confiança</Text><Text className="mt-3 text-4xl font-black tracking-tighter text-foreground">Antes de começar no Life</Text><Text className="mt-5 text-base leading-6 text-muted-foreground">Leia e aceite os Termos de Uso e reconheça a Política de Privacidade da versão {LEGAL_VERSION}. O aceite é registrado na sessão do backend.</Text><Button className="mt-8" size="lg" onPress={()=>void acceptLegal()}>Li e aceito · continuar</Button></ScrollView></SafeAreaView>;

  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerClassName="px-[18px] pb-32 pt-4"><View className="mb-7 flex-row items-center justify-between"><View className="flex-row items-center gap-3"><View className="h-11 w-11 items-center justify-center rounded-md bg-primary"><Text className="font-black text-primary-foreground">L</Text></View><View><Text className="font-black tracking-widest text-foreground">LIFE</Text><Text className="text-xs text-muted-foreground">Life Residence</Text></View></View><View className="h-11 w-11 items-center justify-center rounded-full bg-secondary"><Text className="text-sm font-black text-foreground">GR</Text></View></View>{message?<Pressable onPress={()=>setMessage('')} className="mb-4 rounded-md bg-primary/10 p-3"><Text className="text-xs font-bold leading-5 text-primary">{message}</Text></Pressable>:null}{content}</ScrollView><View className="absolute bottom-3 left-3 right-3 flex-row justify-around rounded-xl border border-border bg-card p-2">{([['home','⌂','Início'],['social','◎','Social'],['market','⌕','Comprar'],['insights','▥','Insights'],['profile','☺','Perfil']] as const).map(([key,icon,label])=><Pressable key={key} accessibilityRole="button" accessibilityLabel={label} onPress={()=>{setTab(key);if(key!=='market')setUseCashback(false)}} className={`min-h-12 flex-1 items-center justify-center rounded-md ${tab===key?'bg-primary/10':''}`}><Text className={tab===key?'text-primary':'text-muted-foreground'}>{icon}</Text><Text className={`mt-1 text-[10px] font-bold ${tab===key?'text-primary':'text-muted-foreground'}`}>{label}</Text></Pressable>)}</View></SafeAreaView>;
}
function SectionTitle({eyebrow,title,sub}:{eyebrow:string;title:string;sub:string}){return <View className="mb-4 mt-8"><Text className="text-xs font-black uppercase tracking-widest text-primary">{eyebrow}</Text><Text className="mt-2 text-2xl font-black tracking-tight text-foreground">{title}</Text><Text className="mt-1 text-sm leading-5 text-muted-foreground">{sub}</Text></View>}
function Metric({label,value}:{label:string;value:string}){return <Card className="mb-3 w-[48%] p-4"><Text className="text-xs text-muted-foreground">{label}</Text><Text className="mt-2 text-base font-black text-foreground">{value}</Text></Card>}
