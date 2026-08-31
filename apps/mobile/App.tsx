import './global.css';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView as SafeAreaViewCompat} from 'react-native-safe-area-context';
import {LEGAL_DOCUMENTS, LEGAL_VERSION} from './src/storage/lifeState';
import {acceptLegalVersion, bootstrapSession, checkoutProduct, type ServerSession} from './src/api/lifeApi';
import {Button} from './src/components/ui/button';
import {Card, CardDescription, CardTitle} from './src/components/ui/card';
import {MerchantCard} from './src/components/life/merchant-card';
import {WalletCard} from './src/components/life/wallet-card';

type Tab='home'|'market'|'social'|'insights'|'profile';
type LegalKey='terms'|'privacy';
type LegalSelection={terms:boolean;privacy:boolean};
type Merchant={id:string;name:string;category:string;rating:number;cashback:number;emoji:string;item:string;price:number};
const LEGAL_COPY:Record<LegalKey,{title:string;sections:Array<{heading:string;body:string}>}>= {
  terms:{title:'Termos de Uso',sections:[
    {heading:'Sobre o Life',body:'O Life é uma experiência demonstrativa de condomínio, marketplace, comunidade e benefícios. As telas e o checkout usam dados simulados e não representam uma oferta de pagamento, crédito ou serviço financeiro.'},
    {heading:'Uso da experiência',body:'Use o produto de modo lícito, mantenha seu acesso sob sua responsabilidade e não tente explorar falhas, contornar validações ou inserir conteúdo que viole direitos de terceiros.'},
    {heading:'Compras e cashback',body:'No protótipo, cashback é um crédito promocional demonstrativo, não é dinheiro e não pode ser sacado. A cotação e os valores exibidos são simulações.'},
    {heading:'Conteúdo e alterações',body:'Você deve ter autorização para publicar conteúdo. O Life pode alterar, interromper ou descontinuar a experiência e apresentará nova versão dos termos quando necessário.'},
  ]},
  privacy:{title:'Política de Privacidade',sections:[
    {heading:'Escopo',body:'Esta minuta descreve o tratamento de dados na experiência demonstrativa do Life. A versão de produção deverá identificar o controlador e seus canais oficiais.'},
    {heading:'Dados e finalidades',body:'O protótipo pode registrar preferências, perfil, pedidos demonstrativos, valores promocionais, avaliações e o aceite dos documentos para exibir funções e manter o estado no servidor. Não armazene número completo de cartão ou código de segurança.'},
    {heading:'Armazenamento e segurança',body:'A sessão mobile fica em armazenamento seguro do dispositivo e o estado financeiro demonstrativo é mantido no servidor. Uma operação real deverá definir provedores, prazos de retenção, controles de acesso e medidas de segurança antes do tratamento.'},
    {heading:'Direitos e contato',body:'Pedidos de acesso, correção, eliminação, portabilidade ou oposição deverão usar o canal de privacidade indicado no produto. O canal e o encarregado ainda dependem de definição e aprovação.'},
  ]},
};
const merchants:Merchant[]=[
  {id:'cesta-fresh',name:'Casa Verde Market',category:'Mercado',rating:4.9,cashback:8,emoji:'🥬',item:'Cesta Fresh',price:64.9},
  {id:'corte-premium',name:'Studio Nômade',category:'Beleza',rating:4.8,cashback:12,emoji:'✂️',item:'Corte Premium',price:55},
  {id:'visita-tecnica',name:'Resolve Casa',category:'Serviços',rating:4.9,cashback:10,emoji:'🛠️',item:'Visita técnica',price:79.9},
];
const brl=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const centsToBrl=(cents:number)=>brl(cents/100);
const idempotencyKey=()=>globalThis.crypto?.randomUUID?.()??`life-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function App(){
  const [tab,setTab]=useState<Tab>('home');
  const [session,setSession]=useState<ServerSession|null>(null);
  const [legalVersion,setLegalVersion]=useState(LEGAL_VERSION);
  const [legalSelection,setLegalSelection]=useState<LegalSelection>({terms:false,privacy:false});
  const [openDocument,setOpenDocument]=useState<LegalKey|null>(null);
  const [hydrated,setHydrated]=useState(false);
  const [isPurchasing,setIsPurchasing]=useState(false);
  const [useCashback,setUseCashback]=useState(false);
  const [message,setMessage]=useState('');
  const purchaseLock=useRef(false);

  const hydrate=()=>{
    setHydrated(false);
    setMessage('');
    bootstrapSession().then(payload=>{
      setSession(payload.session);
      setLegalVersion(payload.legalVersion);
    }).catch(()=>setMessage('Não foi possível estabelecer uma sessão segura com o servidor.')).finally(()=>setHydrated(true));
  };

  useEffect(()=>{hydrate();},[]);

  const cashback=(session?.cashbackCents??0)/100;
  const orders=session?.orders??0;
  const hasLegalConsent=session?.legalAcceptedVersion===legalVersion;

  const acceptLegal=async()=>{
    if(!hydrated||!session||!legalSelection.terms||!legalSelection.privacy){
      setMessage('Leia e marque os dois documentos para continuar.');
      return;
    }
    try{
      setSession(await acceptLegalVersion(legalVersion));
      setLegalSelection({terms:false,privacy:false});
      setMessage('Consentimento registrado no servidor.');
    }catch{
      setMessage('Não foi possível registrar o aceite. Tente novamente.');
    }
  };

  const buy=async(m:Merchant)=>{
    if(!hasLegalConsent||purchaseLock.current)return;
    purchaseLock.current=true;
    setIsPurchasing(true);
    try{
      const payload=await checkoutProduct(m.id,useCashback,idempotencyKey());
      setSession(payload.session);
      setUseCashback(false);
      setMessage(`Pagamento MVP aprovado. Pagamento: ${centsToBrl(payload.allocation.customerPayableCents)} · Cashback ganho: ${centsToBrl(payload.allocation.cashbackEarnedCents)}.`);
    }catch{
      setMessage('Não foi possível concluir a compra simulada. Nenhuma alteração foi aplicada.');
    }finally{
      purchaseLock.current=false;
      setIsPurchasing(false);
    }
  };

  const content=useMemo(()=>{
    if(tab==='market')return <><SectionTitle eyebrow="Perto de você" title="Marketplace" sub="Produtos e serviços próximos. Pagamento sempre dentro do Life."/><WalletCard balance={cashback} onUseCashback={()=>setUseCashback(value=>!value)}/>{merchants.map(m=><MerchantCard key={m.id} {...m} redeemed={useCashback?Math.min(cashback,Math.floor(m.price*100/2)/100):0} processing={isPurchasing} onBuy={()=>void buy(m)}/>)}</>;
    if(tab==='social')return <><SectionTitle eyebrow="Comunidade" title="O que está acontecendo" sub="Experiências locais e avaliações verificadas."/><Card><CardTitle>Marina S. · ★★★★★</CardTitle><CardDescription className="mt-2">Usei a Resolve Casa hoje. Atendimento pontual e serviço concluído rapidamente.</CardDescription><Text className="mt-4 text-xs font-black text-primary">COMPRA VERIFICADA</Text></Card></>;
    if(tab==='insights')return <><SectionTitle eyebrow="Seu dinheiro" title="Insights" sub="Gastos transformados em decisões simples."/><View className="mb-1 flex-row flex-wrap justify-between"><Metric label="Gastos" value={brl(1040)}/><Metric label="Cashback" value={brl(cashback)}/><Metric label="Pedidos" value={String(9+orders)}/><Metric label="Economia" value={brl(86.4)}/></View><Card className="bg-card-elevated"><Text className="text-xs font-black uppercase tracking-widest text-primary">Melhor uso</Text><CardTitle className="mt-3">Serviços residenciais combinam com seu histórico.</CardTitle><CardDescription className="mt-2">A Resolve Casa tem 10% de cashback e boa reputação perto de você.</CardDescription><Button className="mt-5" onPress={()=>setTab('market')}>Ver recomendação</Button></Card></>;
    if(tab==='profile')return <><SectionTitle eyebrow="Sua conta" title="Perfil" sub="Privacidade e controle sem expor dados condominiais."/><WalletCard balance={cashback} onUseCashback={()=>setTab('market')}/><Card className="mt-3"><CardTitle>Documentos legais</CardTitle><CardDescription className="mt-2">Versão aceita: {session?.legalAcceptedVersion??'nenhuma'}</CardDescription>{LEGAL_DOCUMENTS.map(document=><Button key={document.key} variant="outline" className="mt-3" onPress={()=>setOpenDocument(document.key as LegalKey)}>Abrir {document.label}</Button>)}</Card></>;
    return <><Text className="mb-2 text-xs font-black uppercase tracking-widest text-primary">Seu dia no Life</Text><Text className="mb-6 text-4xl font-black tracking-tighter text-foreground">Boa noite.{`\n`}Tudo perto de você.</Text><WalletCard balance={cashback} onUseCashback={()=>setTab('market')}/><SectionTitle eyebrow="Seu condomínio" title="Ações rápidas" sub="O essencial sem menus complexos."/><View className="flex-row flex-wrap justify-between"><Metric label="📦 Encomenda" value="1 aguardando"/><Metric label="🔑 Visitante" value="Gerar acesso"/><Metric label="🛍️ Comprar" value="Marketplace"/><Metric label="↗ Insights" value="Economizar"/></View></>;
  },[tab,cashback,orders,session,hasLegalConsent,isPurchasing,useCashback]);

  return <SafeAreaProvider><SafeAreaViewCompat className="flex-1 bg-background" edges={['top','bottom']}>
    {!hydrated?<View className="flex-1 items-center justify-center bg-background"><Text className="text-xl font-black tracking-widest text-foreground">LIFE</Text><Text className="mt-2 text-sm text-muted-foreground">Carregando…</Text></View>:!session?<ConnectionState message={message} onRetry={hydrate}/>:!hasLegalConsent?<LegalGate version={legalVersion} selection={legalSelection} onToggle={key=>setLegalSelection(current=>({...current,[key]:!current[key]}))} onOpen={key=>setOpenDocument(key)} onAccept={()=>void acceptLegal()} message={message}/>:<>
      <ScrollView contentContainerClassName="px-screen pb-32 pt-4"><View className="mb-7 flex-row items-center justify-between"><View className="flex-row items-center gap-3"><View className="h-11 w-11 items-center justify-center rounded-md bg-primary"><Text className="font-black text-primary-foreground">L</Text></View><View><Text className="font-black tracking-widest text-foreground">LIFE</Text><Text className="text-xs text-muted-foreground">Life Residence</Text></View></View><View className="h-11 w-11 items-center justify-center rounded-full bg-secondary"><Text className="text-sm font-black text-foreground">GR</Text></View></View>{message?<Pressable onPress={()=>setMessage('')} className="mb-4 rounded-md bg-primary/10 p-3"><Text className="text-xs font-bold leading-5 text-primary">{message}</Text></Pressable>:null}{content}</ScrollView><View className="absolute bottom-3 left-3 right-3 flex-row justify-around rounded-xl border border-border bg-card p-2">{([['home','⌂','Início'],['social','◎','Social'],['market','⌕','Comprar'],['insights','▥','Insights'],['profile','☺','Perfil']] as const).map(([key,icon,label])=><Pressable key={key} accessibilityRole="button" accessibilityLabel={label} onPress={()=>setTab(key)} className={`min-h-12 flex-1 items-center justify-center rounded-md focus:bg-primary/10 ${tab===key?'bg-primary/10':''}`}><Text className={tab===key?'text-primary':'text-muted-foreground'}>{icon}</Text><Text className={`mt-1 text-[10px] font-bold ${tab===key?'text-primary':'text-muted-foreground'}`}>{label}</Text></Pressable>)}</View>
    </>}
    <LegalDocumentModal version={legalVersion} documentKey={openDocument} onClose={()=>setOpenDocument(null)}/>
  </SafeAreaViewCompat></SafeAreaProvider>;
}

function ConnectionState({message,onRetry}:{message:string;onRetry:()=>void}){return <View className="flex-1 justify-center px-screen"><Text className="text-xs font-black uppercase tracking-widest text-primary">Conexão segura necessária</Text><Text className="mt-3 text-3xl font-black tracking-tighter text-foreground">Não foi possível carregar o Life</Text><Text className="mt-4 text-base leading-6 text-muted-foreground">{message||'Verifique a conexão com o servidor de demonstração e tente novamente.'}</Text><Button className="mt-7" onPress={onRetry}>Tentar novamente</Button></View>}
function LegalGate({version,selection,onToggle,onOpen,onAccept,message}:{version:string;selection:LegalSelection;onToggle:(key:LegalKey)=>void;onOpen:(key:LegalKey)=>void;onAccept:()=>void;message:string}){
  return <ScrollView contentContainerClassName="flex-grow justify-center px-screen py-10"><Text className="text-xs font-black uppercase tracking-widest text-primary">Privacidade e confiança</Text><Text className="mt-3 text-4xl font-black tracking-tighter text-foreground">Antes de começar no Life</Text><Text className="mt-5 text-base leading-6 text-muted-foreground">Leia os dois documentos da versão {version}. O aceite fica registrado no servidor deste MVP demonstrativo.</Text>{LEGAL_DOCUMENTS.map(document=><Button key={document.key} variant="outline" className="mt-4" onPress={()=>onOpen(document.key as LegalKey)}>Ler {document.label} · {version}</Button>)}<CheckRow version={version} checked={selection.terms} label="Li e aceito os Termos de Uso" onPress={()=>onToggle('terms')}/><CheckRow version={version} checked={selection.privacy} label="Li e aceito a Política de Privacidade" onPress={()=>onToggle('privacy')}/><Button className="mt-7" size="lg" disabled={!selection.terms||!selection.privacy} onPress={onAccept}>Aceitar e continuar</Button>{message?<Text className="mt-4 text-sm font-bold text-warning">{message}</Text>:null}</ScrollView>;
}
function CheckRow({version,checked,label,onPress}:{version:string;checked:boolean;label:string;onPress:()=>void}){return <Pressable accessibilityRole="checkbox" accessibilityState={{checked}} onPress={onPress} className="mt-4 min-h-11 flex-row items-center rounded-md px-1 focus:bg-primary/10"><Text className="mr-3 text-2xl text-primary">{checked?'☑':'☐'}</Text><Text className="flex-1 text-sm leading-5 text-foreground">{label} · {version}</Text></Pressable>}
function LegalDocumentModal({version,documentKey,onClose}:{version:string;documentKey:LegalKey|null;onClose:()=>void}){
  const document=documentKey?LEGAL_COPY[documentKey]:null;
  return <Modal visible={document!==null} animationType="slide" onRequestClose={onClose}><SafeAreaViewCompat className="flex-1 bg-background" edges={['top','bottom']}><View className="flex-row items-center justify-between px-screen py-4"><Text className="font-black tracking-widest text-foreground">LIFE</Text><Text className="text-xs font-black text-primary">VERSÃO {version}</Text></View>{document?<ScrollView contentContainerClassName="px-screen pb-8"><Text className="text-3xl font-black text-foreground">{document.title}</Text><Text className="mt-2 text-xs text-muted-foreground">Documento {documentKey==='terms'?'terms-of-use':'privacy-policy'} · versão {version}</Text><Text className="mt-5 text-sm leading-5 text-warning">Minuta do MVP demonstrativo. Revisão e aprovação jurídica são necessárias antes de operação comercial.</Text>{document.sections.map(section=><View key={section.heading} className="mt-6"><Text className="text-lg font-black text-foreground">{section.heading}</Text><Text className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</Text></View>)}<Button variant="outline" className="mt-8" onPress={onClose}>Fechar documento</Button></ScrollView>:null}</SafeAreaViewCompat></Modal>;
}
function SectionTitle({eyebrow,title,sub}:{eyebrow:string;title:string;sub:string}){return <View className="mb-4 mt-section"><Text className="text-xs font-black uppercase tracking-widest text-primary">{eyebrow}</Text><Text className="mt-2 text-2xl font-black tracking-tight text-foreground">{title}</Text><Text className="mt-1 text-sm leading-5 text-muted-foreground">{sub}</Text></View>}
function Metric({label,value}:{label:string;value:string}){return <Card className="mb-3 w-[48%] p-card"><Text className="text-xs text-muted-foreground">{label}</Text><Text className="mt-2 text-base font-black text-foreground">{value}</Text></Card>}
