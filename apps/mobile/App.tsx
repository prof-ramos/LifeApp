import React, {useEffect, useMemo, useRef, useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {loadLocalLifeState, saveLocalLifeState} from './src/storage/lifeStorage';

type Tab='home'|'market'|'social'|'insights'|'profile';
type Merchant={id:number;name:string;category:string;rating:number;cashback:number;emoji:string;item:string;price:number};
const LEGAL_VERSION='2026-08-30';
const merchants:Merchant[]=[
  {id:1,name:'Casa Verde Market',category:'Mercado',rating:4.9,cashback:8,emoji:'🥬',item:'Cesta Fresh',price:64.9},
  {id:2,name:'Studio Nômade',category:'Beleza',rating:4.8,cashback:12,emoji:'✂️',item:'Corte Premium',price:55},
  {id:3,name:'Resolve Casa',category:'Serviços',rating:4.9,cashback:10,emoji:'🛠️',item:'Visita técnica',price:79.9},
];
const brl=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const money=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;

export default function App(){
  const [tab,setTab]=useState<Tab>('home');
  const [cashback,setCashback]=useState(27.8);
  const [orders,setOrders]=useState(0);
  const [legalAcceptedVersion,setLegalAcceptedVersion]=useState<string|null>(null);
  const [hydrated,setHydrated]=useState(false);
  const [useCashback,setUseCashback]=useState(false);
  const [isPurchasing,setIsPurchasing]=useState(false);
  const [message,setMessage]=useState('');
  const purchaseLock=useRef(false);
  const localRef=useRef({cashback:27.8,orders:0,legalAcceptedVersion:null as string|null});
  const spent=1040;

  useEffect(()=>{
    let active=true;
    loadLocalLifeState().then(state=>{
      if(!active)return;
      localRef.current=state;
      setCashback(state.cashback);
      setOrders(state.orders);
      setLegalAcceptedVersion(state.legalAcceptedVersion);
    }).catch(()=>{}).finally(()=>{if(active)setHydrated(true)});
    return()=>{active=false};
  },[]);

  const acceptLegal=async()=>{
    const next={...localRef.current,legalAcceptedVersion:LEGAL_VERSION};
    localRef.current=next;
    setLegalAcceptedVersion(LEGAL_VERSION);
    await saveLocalLifeState(next);
  };

  const buy=async(m:Merchant)=>{
    if(purchaseLock.current)return;
    purchaseLock.current=true;
    setIsPurchasing(true);
    try{
      const current=localRef.current;
      const cashbackUsed=useCashback?money(Math.min(current.cashback,m.price*0.5)):0;
      const customerPayable=money(m.price-cashbackUsed);
      const earned=money(customerPayable*(m.cashback/100));
      const next={
        cashback:money(current.cashback-cashbackUsed+earned),
        orders:current.orders+1,
        legalAcceptedVersion:current.legalAcceptedVersion,
      };
      localRef.current=next;
      setCashback(next.cashback);
      setOrders(next.orders);
      setUseCashback(false);
      await saveLocalLifeState(next);
      setMessage(`Pagamento MVP aprovado: ${brl(customerPayable)}. Usado ${brl(cashbackUsed)} e gerado ${brl(earned)} de cashback.`);
    }finally{
      purchaseLock.current=false;
      setIsPurchasing(false);
    }
  };

  const content=useMemo(()=>{
    if(tab==='market')return <><Heading title="Marketplace" sub="Produtos e serviços próximos. Pagamento sempre dentro do Life."/><Card><Text style={s.cardTitle}>Life Wallet</Text><Text style={s.big}>{brl(cashback)}</Text><Text style={s.muted}>No MVP, até 50% de cada compra pode ser coberto com cashback.</Text><Button label={useCashback?'Não usar cashback':'Aplicar cashback'} onPress={()=>setUseCashback(v=>!v)}/></Card>{merchants.map(m=>{const used=useCashback?money(Math.min(cashback,m.price*0.5)):0;return <Card key={m.id}><Text style={s.emoji}>{m.emoji}</Text><Text style={s.cardTitle}>{m.name}</Text><Text style={s.muted}>{m.category} · ★ {m.rating}</Text><View style={s.row}><Text style={s.price}>{brl(m.price)}</Text><Text style={s.cash}>{m.cashback}% cashback</Text></View><Text style={s.muted}>{m.item}</Text>{used>0?<Text style={s.body}>Cashback aplicado: {brl(used)} · pagar {brl(m.price-used)}</Text>:null}<Button label={isPurchasing?'Processando…':'Comprar no Life'} disabled={isPurchasing} onPress={()=>void buy(m)}/></Card>})}</>;
    if(tab==='social')return <><Heading title="Comunidade" sub="Experiências locais e avaliações verificadas."/><Card><Text style={s.cardTitle}>Marina S. · ★★★★★</Text><Text style={s.body}>Usei a Resolve Casa hoje. Atendimento pontual e serviço concluído rapidamente.</Text><Text style={s.cash}>Compra verificada</Text></Card></>;
    if(tab==='insights')return <><Heading title="Insights" sub="Seus gastos transformados em decisões."/><View style={s.metrics}><Mini label="Gastos" value={brl(spent)}/><Mini label="Cashback" value={brl(cashback)}/><Mini label="Pedidos" value={String(9+orders)}/><Mini label="Economia" value={brl(86.4)}/></View><Card><Text style={s.cardTitle}>Melhor uso do cashback</Text><Text style={s.body}>Você costuma usar serviços residenciais. A Resolve Casa tem 10% de cashback e boa reputação perto de você.</Text><Button label="Usar cashback" onPress={()=>{setUseCashback(true);setTab('market')}}/></Card></>;
    if(tab==='profile')return <><Heading title="Gabriel" sub="Life Residence"/><Card><Text style={s.cardTitle}>Life Wallet</Text><Text style={s.big}>{brl(cashback)}</Text><Text style={s.muted}>Crédito promocional para uso dentro do Life.</Text></Card><Card><Text style={s.cardTitle}>Privacidade</Text><Text style={s.body}>Perfil social limpo, dados condominiais privados e preferências controláveis.</Text></Card><Card><Text style={s.cardTitle}>Documentos legais</Text><Text style={s.body}>Versão aceita: {legalAcceptedVersion}</Text></Card></>;
    return <><Card accent><Text style={s.eyebrow}>SEU DIA NO LIFE</Text><Text style={s.hero}>Boa noite.{`\n`}Você tem {brl(cashback)} para usar.</Text><Button label="Usar cashback" onPress={()=>{setUseCashback(true);setTab('market')}}/></Card><Heading title="Ações rápidas" sub="O essencial sem menus complexos."/><View style={s.quick}><Mini label="📦 Encomenda" value="1 aguardando"/><Mini label="🔑 Visitante" value="Gerar acesso"/><Mini label="🛍️ Comprar" value="Marketplace"/><Mini label="↗ Insights" value="Economizar"/></View></>;
  },[tab,cashback,orders,legalAcceptedVersion,useCashback,isPurchasing]);

  if(!hydrated)return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.logo}>LIFE</Text><Text style={s.muted}>Carregando…</Text></View></SafeAreaView>;
  if(legalAcceptedVersion!==LEGAL_VERSION)return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.legal}><Text style={s.eyebrow}>PRIVACIDADE E CONFIANÇA</Text><Text style={s.hero}>Antes de começar no Life</Text><Text style={s.body}>Leia e aceite os Termos de Uso e reconheça a Política de Privacidade da versão {LEGAL_VERSION}. Neste MVP, a evidência do aceite é persistida localmente; em produção será registrada no backend.</Text><Button label="Li e aceito · continuar" onPress={()=>void acceptLegal()}/></ScrollView></SafeAreaView>;

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.container}><View style={s.top}><Text style={s.logo}>LIFE</Text><View style={s.avatar}><Text style={s.avatarText}>GR</Text></View></View>{message?<TouchableOpacity onPress={()=>setMessage('')} style={s.toast}><Text style={s.toastText}>{message}</Text></TouchableOpacity>:null}{content}</ScrollView><View style={s.nav}>{([['home','⌂','Início'],['market','⌕','Comprar'],['social','◎','Social'],['insights','▥','Insights'],['profile','☺','Perfil']] as const).map(([k,icon,label])=><TouchableOpacity key={k} onPress={()=>{setTab(k);if(k!=='market')setUseCashback(false)}} style={[s.navItem,tab===k&&s.navActive]}><Text style={s.navIcon}>{icon}</Text><Text style={s.navLabel}>{label}</Text></TouchableOpacity>)}</View></SafeAreaView>;
}

function Heading({title,sub}:{title:string;sub:string}){return <View style={s.heading}><Text style={s.headingText}>{title}</Text><Text style={s.muted}>{sub}</Text></View>}
function Card({children,accent=false}:{children:React.ReactNode;accent?:boolean}){return <View style={[s.card,accent&&s.accent]}>{children}</View>}
function Mini({label,value}:{label:string;value:string}){return <View style={s.mini}><Text style={s.muted}>{label}</Text><Text style={s.miniValue}>{value}</Text></View>}
function Button({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}){return <TouchableOpacity disabled={disabled} style={[s.button,disabled&&s.buttonDisabled]} onPress={onPress}><Text style={s.buttonText}>{label}</Text></TouchableOpacity>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#07111f'},container:{padding:18,paddingBottom:110},legal:{padding:24,justifyContent:'center',flexGrow:1},center:{flex:1,alignItems:'center',justifyContent:'center',gap:12},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:18},logo:{fontSize:22,fontWeight:'900',color:'#f6f8fb',letterSpacing:1},avatar:{width:42,height:42,borderRadius:21,backgroundColor:'#17304a',alignItems:'center',justifyContent:'center'},avatarText:{color:'#f6f8fb',fontWeight:'800'},card:{backgroundColor:'#0d1a2b',borderWidth:1,borderColor:'rgba(255,255,255,0.09)',borderRadius:24,padding:20,marginBottom:14},accent:{backgroundColor:'#10283a'},eyebrow:{color:'#79f2c0',fontSize:11,fontWeight:'900',letterSpacing:1.3},hero:{color:'#f6f8fb',fontSize:34,lineHeight:38,fontWeight:'900',letterSpacing:-1.5,marginTop:10,marginBottom:18},heading:{marginTop:8,marginBottom:12},headingText:{color:'#f6f8fb',fontSize:24,fontWeight:'900',letterSpacing:-.7},muted:{color:'#93a4b8',fontSize:13,lineHeight:19},cardTitle:{color:'#f6f8fb',fontSize:19,fontWeight:'800',marginBottom:6},body:{color:'#dce5ef',fontSize:15,lineHeight:22,marginBottom:12},button:{backgroundColor:'#79f2c0',paddingVertical:13,paddingHorizontal:16,borderRadius:16,alignItems:'center',marginTop:14},buttonDisabled:{opacity:.5},buttonText:{color:'#06111f',fontWeight:'900'},quick:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},metrics:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},mini:{width:'48%',backgroundColor:'#0d1a2b',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:18,padding:15,marginBottom:12},miniValue:{color:'#f6f8fb',fontWeight:'900',fontSize:18,marginTop:7},emoji:{fontSize:42,marginBottom:10},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:10},price:{color:'#f6f8fb',fontWeight:'900',fontSize:18},cash:{color:'#79f2c0',fontWeight:'800',fontSize:13},big:{color:'#f6f8fb',fontSize:40,fontWeight:'900',marginVertical:8},nav:{position:'absolute',left:12,right:12,bottom:10,backgroundColor:'#0a1726',borderRadius:24,borderWidth:1,borderColor:'rgba(255,255,255,0.09)',padding:7,flexDirection:'row',justifyContent:'space-around'},navItem:{flex:1,alignItems:'center',padding:8,borderRadius:16},navActive:{backgroundColor:'rgba(121,242,192,0.10)'},navIcon:{color:'#f6f8fb',fontSize:18},navLabel:{color:'#93a4b8',fontSize:10,marginTop:2},toast:{backgroundColor:'#e9fff6',borderRadius:16,padding:13,marginBottom:14},toastText:{color:'#07111f',fontWeight:'800'}});
