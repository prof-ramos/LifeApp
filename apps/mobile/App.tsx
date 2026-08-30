import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView as SafeAreaViewCompat} from 'react-native-safe-area-context';
import {LEGAL_DOCUMENTS, LEGAL_VERSION} from './src/storage/lifeState';
import {loadLocalLifeState, saveLocalLifeState} from './src/storage/lifeStorage';
import type {LocalLifeState} from './src/storage/lifeStorage';

type Tab='home'|'market'|'social'|'insights'|'profile';
type Merchant={id:number;name:string;category:string;rating:number;cashback:number;emoji:string;item:string;price:number};
type LegalSelection={terms:boolean;privacy:boolean};
type LegalConsent=LocalLifeState['legalConsent'];
const merchants:Merchant[]=[
  {id:1,name:'Casa Verde Market',category:'Mercado',rating:4.9,cashback:8,emoji:'🥬',item:'Cesta Fresh',price:64.9},
  {id:2,name:'Studio Nômade',category:'Beleza',rating:4.8,cashback:12,emoji:'✂️',item:'Corte Premium',price:55},
  {id:3,name:'Resolve Casa',category:'Serviços',rating:4.9,cashback:10,emoji:'🛠️',item:'Visita técnica',price:79.9},
];
const brl=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const legalUrl=(path:string)=>`http://localhost:4173${path}`;

export default function App(){
  const [tab,setTab]=useState<Tab>('home');
  const [cashback,setCashback]=useState(27.8);
  const [orders,setOrders]=useState(0);
  const [legalConsent,setLegalConsent]=useState<LegalConsent>(null);
  const [legalSelection,setLegalSelection]=useState<LegalSelection>({terms:false,privacy:false});
  const [purchaseInFlight,setPurchaseInFlight]=useState(false);
  const [message,setMessage]=useState('');
  const purchaseLock=useRef(false);
  const spent=1040;

  useEffect(()=>{
    let active=true;
    loadLocalLifeState().then(state=>{
      if(!active)return;
      setCashback(state.cashback);
      setOrders(state.orders);
      setLegalConsent(state.legalConsent);
    }).catch(()=>{
      if(active)setMessage('Não foi possível carregar seu estado local.');
    });
    return()=>{active=false};
  },[]);

  const persistNext=async(next:LocalLifeState)=>{
    await saveLocalLifeState(next);
    setCashback(next.cashback);
    setOrders(next.orders);
    setLegalConsent(next.legalConsent);
  };

  const openLegal=(path:string)=>{
    Linking.openURL(legalUrl(path)).catch(()=>setMessage('Não foi possível abrir o documento.'));
  };

  const toggleLegal=(key:keyof LegalSelection)=>{
    if(legalConsent)return;
    setLegalSelection(current=>({...current,[key]:!current[key]}));
  };

  const acceptLegal=async()=>{
    if(!legalSelection.terms||!legalSelection.privacy){
      setMessage('Leia e marque os dois documentos para continuar.');
      return;
    }
    const acceptedAt=new Date().toISOString();
    const nextConsent={
      acceptedAt,
      context:'mobile-mvp',
      terms:{document:'terms-of-use',version:LEGAL_VERSION,acceptedAt},
      privacy:{document:'privacy-policy',version:LEGAL_VERSION,acceptedAt},
    } as NonNullable<LegalConsent>;
    try{
      await persistNext({cashback,orders,legalConsent:nextConsent});
      setMessage('Consentimento registrado.');
    }catch{
      setMessage('Não foi possível salvar o aceite. Tente novamente.');
    }
  };

  const buy=async(m:Merchant)=>{
    if(!legalConsent||purchaseLock.current)return;
    purchaseLock.current=true;
    setPurchaseInFlight(true);
    const earned=Math.round(m.price*(m.cashback/100)*100)/100;
    const next:LocalLifeState={
      cashback:Math.round((cashback+earned)*100)/100,
      orders:orders+1,
      legalConsent,
    };
    try{
      await persistNext(next);
      setMessage(`Pagamento MVP aprovado. Você ganhou ${brl(earned)} de cashback.`);
    }catch{
      setMessage('Não foi possível salvar a compra. Nenhuma alteração foi aplicada.');
    }finally{
      purchaseLock.current=false;
      setPurchaseInFlight(false);
    }
  };

  const content=useMemo(()=>{
    if(tab==='market')return <><Heading title="Marketplace" sub="Produtos e serviços próximos. Pagamento sempre dentro do Life."/>{merchants.map(m=><Card key={m.id}><Text style={s.emoji}>{m.emoji}</Text><Text style={s.cardTitle}>{m.name}</Text><Text style={s.muted}>{m.category} · ★ {m.rating}</Text><View style={s.row}><Text style={s.price}>{brl(m.price)}</Text><Text style={s.cash}>{m.cashback}% cashback</Text></View><Text style={s.muted}>{m.item}</Text><Button label="Comprar no Life" onPress={()=>void buy(m)} disabled={purchaseInFlight}/></Card>)}</>;
    if(tab==='social')return <><Heading title="Comunidade" sub="Experiências locais e avaliações verificadas."/><Card><Text style={s.cardTitle}>Marina S. · ★★★★★</Text><Text style={s.body}>Usei a Resolve Casa hoje. Atendimento pontual e serviço concluído rapidamente.</Text><Text style={s.cash}>Compra verificada</Text></Card></>;
    if(tab==='insights')return <><Heading title="Insights" sub="Seus gastos transformados em decisões."/><View style={s.metrics}><Mini label="Gastos" value={brl(spent)}/><Mini label="Cashback" value={brl(cashback)}/><Mini label="Pedidos" value={String(9+orders)}/><Mini label="Economia" value={brl(86.4)}/></View><Card><Text style={s.cardTitle}>Melhor uso do cashback</Text><Text style={s.body}>Você costuma usar serviços residenciais. A Resolve Casa tem 10% de cashback e boa reputação perto de você.</Text><Button label="Ver recomendação" onPress={()=>setTab('market')}/></Card></>;
    if(tab==='profile')return <><Heading title="Gabriel" sub="Life Residence · Torre A · 804"/><Card><Text style={s.cardTitle}>Life Wallet</Text><Text style={s.big}>{brl(cashback)}</Text><Text style={s.muted}>Crédito promocional para uso dentro do Life.</Text></Card><Card><Text style={s.cardTitle}>Privacidade</Text><Text style={s.body}>Perfil social limpo, dados condominiais privados e preferências controláveis.</Text></Card><Card><Text style={s.cardTitle}>Documentos jurídicos</Text>{LEGAL_DOCUMENTS.map(document=><Button key={document.key} label={`Abrir ${document.label} · ${LEGAL_VERSION}`} onPress={()=>openLegal(document.path)}/>)}</Card></>;
    return <><Card accent><Text style={s.eyebrow}>SEU DIA NO LIFE</Text><Text style={s.hero}>Boa noite.{`\n`}Você tem {brl(cashback)} para usar.</Text><Button label="Usar cashback" onPress={()=>setTab('market')}/></Card><Heading title="Ações rápidas" sub="O essencial sem menus complexos."/><View style={s.quick}><Mini label="📦 Encomenda" value="1 aguardando"/><Mini label="🔑 Visitante" value="Gerar acesso"/><Mini label="🛍️ Comprar" value="Marketplace"/><Mini label="↗ Insights" value="Economizar"/></View></>;
  },[tab,cashback,orders,purchaseInFlight,legalConsent]);

  return <SafeAreaProvider><SafeAreaViewCompat style={s.safe} edges={['top','bottom']}>
    {!legalConsent?<LegalGate selection={legalSelection} onToggle={toggleLegal} onOpen={openLegal} onAccept={()=>void acceptLegal()}/>:<>
      <ScrollView contentContainerStyle={s.container}><View style={s.top}><Text style={s.logo}>LIFE</Text><View style={s.avatar}><Text style={s.avatarText}>GR</Text></View></View>{message?<TouchableOpacity onPress={()=>setMessage('')} style={s.toast}><Text style={s.toastText}>{message}</Text></TouchableOpacity>:null}{content}</ScrollView>
      <View style={s.nav}>{([['home','⌂','Início'],['market','⌕','Comprar'],['social','◎','Social'],['insights','▥','Insights'],['profile','☺','Perfil']] as const).map(([k,icon,label])=><TouchableOpacity key={k} onPress={()=>setTab(k)} style={[s.navItem,tab===k&&s.navActive]}><Text style={s.navIcon}>{icon}</Text><Text style={s.navLabel}>{label}</Text></TouchableOpacity>)}</View>
    </>}
    {!legalConsent&&message?<TouchableOpacity onPress={()=>setMessage('')} style={s.gateMessage}><Text style={s.toastText}>{message}</Text></TouchableOpacity>:null}
  </SafeAreaViewCompat></SafeAreaProvider>;
}

function LegalGate({selection,onToggle,onOpen,onAccept}:{selection:LegalSelection;onToggle:(key:keyof LegalSelection)=>void;onOpen:(path:string)=>void;onAccept:()=>void}){
  return <ScrollView contentContainerStyle={s.container}><View style={s.top}><Text style={s.logo}>LIFE</Text><Text style={s.badge}>VERSÃO {LEGAL_VERSION}</Text></View><Card accent><Text style={s.eyebrow}>ANTES DE CONTINUAR</Text><Text style={s.headingText}>Leia os documentos do Life</Text><Text style={s.body}>O aceite registra o documento, a versão e o momento da sua escolha neste MVP demonstrativo.</Text>{LEGAL_DOCUMENTS.map(document=><Button key={document.key} label={`Ler ${document.label} · ${LEGAL_VERSION}`} onPress={()=>onOpen(document.path)}/>)}<CheckRow checked={selection.terms} label="Li e aceito os Termos de Uso" onPress={()=>onToggle('terms')}/><CheckRow checked={selection.privacy} label="Li e aceito a Política de Privacidade" onPress={()=>onToggle('privacy')}/><Button label="Aceitar e continuar" onPress={onAccept} disabled={!selection.terms||!selection.privacy}/></Card></ScrollView>;
}

function CheckRow({checked,label,onPress}:{checked:boolean;label:string;onPress:()=>void}){return <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{checked}} onPress={onPress} style={s.checkRow}><Text style={s.check}>{checked?'☑':'☐'}</Text><Text style={s.body}>{label} · {LEGAL_VERSION}</Text></TouchableOpacity>}
function Heading({title,sub}:{title:string;sub:string}){return <View style={s.heading}><Text style={s.headingText}>{title}</Text><Text style={s.muted}>{sub}</Text></View>}
function Card({children,accent=false}:{children:React.ReactNode;accent?:boolean}){return <View style={[s.card,accent&&s.accent]}>{children}</View>}
function Mini({label,value}:{label:string;value:string}){return <View style={s.mini}><Text style={s.muted}>{label}</Text><Text style={s.miniValue}>{value}</Text></View>}
function Button({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}){return <TouchableOpacity accessibilityRole="button" disabled={disabled} style={[s.button,disabled&&s.buttonDisabled]} onPress={onPress}><Text style={s.buttonText}>{label}</Text></TouchableOpacity>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#07111f'},container:{padding:18,paddingBottom:110},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:18},logo:{fontSize:22,fontWeight:'900',color:'#f6f8fb',letterSpacing:1},badge:{color:'#79f2c0',fontSize:11,fontWeight:'900',letterSpacing:1},avatar:{width:42,height:42,borderRadius:21,backgroundColor:'#17304a',alignItems:'center',justifyContent:'center'},avatarText:{color:'#f6f8fb',fontWeight:'800'},card:{backgroundColor:'#0d1a2b',borderWidth:1,borderColor:'rgba(255,255,255,0.09)',borderRadius:24,padding:20,marginBottom:14},accent:{backgroundColor:'#10283a'},eyebrow:{color:'#79f2c0',fontSize:11,fontWeight:'900',letterSpacing:1.3},hero:{color:'#f6f8fb',fontSize:34,lineHeight:38,fontWeight:'900',letterSpacing:-1.5,marginTop:10,marginBottom:18},heading:{marginTop:8,marginBottom:12},headingText:{color:'#f6f8fb',fontSize:24,fontWeight:'900',letterSpacing:-.7},muted:{color:'#93a4b8',fontSize:13,lineHeight:19},cardTitle:{color:'#f6f8fb',fontSize:19,fontWeight:'800',marginBottom:6},body:{color:'#dce5ef',fontSize:15,lineHeight:22,marginBottom:12},button:{backgroundColor:'#79f2c0',paddingVertical:13,paddingHorizontal:16,borderRadius:16,alignItems:'center',marginTop:14},buttonDisabled:{opacity:.45},buttonText:{color:'#06111f',fontWeight:'900'},quick:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},metrics:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},mini:{width:'48%',backgroundColor:'#0d1a2b',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:18,padding:15,marginBottom:12},miniValue:{color:'#f6f8fb',fontWeight:'900',fontSize:18,marginTop:7},emoji:{fontSize:42,marginBottom:10},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:10},price:{color:'#f6f8fb',fontWeight:'900',fontSize:18},cash:{color:'#79f2c0',fontWeight:'800',fontSize:13},big:{color:'#f6f8fb',fontSize:40,fontWeight:'900',marginVertical:8},nav:{position:'absolute',left:12,right:12,bottom:10,backgroundColor:'#0a1726',borderRadius:24,borderWidth:1,borderColor:'rgba(255,255,255,0.09)',padding:7,flexDirection:'row',justifyContent:'space-around'},navItem:{flex:1,alignItems:'center',padding:8,borderRadius:16},navActive:{backgroundColor:'rgba(121,242,192,0.10)'},navIcon:{color:'#f6f8fb',fontSize:18},navLabel:{color:'#93a4b8',fontSize:10,marginTop:2},toast:{backgroundColor:'#e9fff6',borderRadius:16,padding:13,marginBottom:14},gateMessage:{position:'absolute',left:18,right:18,bottom:18,backgroundColor:'#e9fff6',borderRadius:16,padding:13},toastText:{color:'#07111f',fontWeight:'800'},checkRow:{flexDirection:'row',alignItems:'center',marginTop:12},check:{color:'#79f2c0',fontSize:26,marginRight:10}});
