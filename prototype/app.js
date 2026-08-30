const brl=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
const LEGAL_VERSION='2026-08-30';
const merchants=[
{id:'cesta-fresh',name:'Casa Verde Market',category:'Mercado',rating:4.9,cashback:8,item:'Cesta Fresh',priceCents:6490},
{id:'corte-premium',name:'Studio Nômade',category:'Beleza',rating:4.8,cashback:12,item:'Corte Premium',priceCents:5500},
{id:'visita-tecnica',name:'Resolve Casa',category:'Serviços',rating:4.9,cashback:10,item:'Visita técnica',priceCents:7990}
];
const uiDefault={route:'home',role:'resident',cashbackMode:false};
let persisted={};try{persisted=JSON.parse(localStorage.getItem('life-ui')||'{}')}catch{}
let ui={...uiDefault,...persisted};
let session=null;
let legalVersion=LEGAL_VERSION;
let purchasing=false;
let bootError='';
const saveUi=()=>localStorage.setItem('life-ui',JSON.stringify(ui));
const go=route=>{ui.route=route;if(route!=='market')ui.cashbackMode=false;saveUi();render()};
const useCashback=()=>{ui.cashbackMode=true;ui.route='market';saveUi();render()};
const toggleCashback=()=>{ui.cashbackMode=!ui.cashbackMode;saveUi();render()};
const switchRole=()=>{ui.role=ui.role==='resident'?'merchant':ui.role==='merchant'?'manager':'resident';ui.route='home';ui.cashbackMode=false;saveUi();render()};
const request=async(path,options={})=>{const res=await fetch(path,{credentials:'same-origin',...options,headers:{...(options.body?{'content-type':'application/json'}:{}),...(options.headers||{})}});const payload=await res.json().catch(()=>({}));if(!res.ok){const error=new Error(payload?.error?.code||'REQUEST_FAILED');error.status=res.status;throw error}return payload};
async function hydrate(){try{const payload=await request('/api/session');session=payload.session;legalVersion=payload.legalVersion;bootError=''}catch{bootError='Não foi possível estabelecer uma sessão segura com o servidor.'}render()}
async function acceptLegal(){try{const payload=await request('/api/legal/accept',{method:'POST',body:JSON.stringify({version:legalVersion})});session=payload.session;render()}catch{alert('Não foi possível registrar o aceite no servidor.')}}
async function buy(id){
  if(purchasing||!session||ui.role!=='resident')return;
  purchasing=true;render();
  try{
    const payload=await request('/api/checkout/commit',{method:'POST',headers:{'idempotency-key':crypto.randomUUID()},body:JSON.stringify({productId:id,useCashback:ui.cashbackMode})});
    session=payload.session;ui.cashbackMode=false;saveUi();
    const a=payload.allocation;
    alert(`Pagamento MVP aprovado: ${brl(a.customerPayableCents)}. Cashback usado: ${brl(a.cashbackUsedCents)} · Novo cashback: ${brl(a.cashbackEarnedCents)} · Condomínio: ${brl(a.condominiumShareCents)}`);
  }catch{alert('Não foi possível concluir a compra simulada.');}
  finally{purchasing=false;render();}
}

const node=(tag,{className,text,onClick,disabled,href,target,rel}={})=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=String(text);if(onClick)e.addEventListener('click',onClick);if(disabled)e.disabled=true;if(href)e.href=href;if(target)e.target=target;if(rel)e.rel=rel;return e};
const add=(parent,...children)=>{for(const child of children.flat()){if(child)parent.append(child)}return parent};
const card=(title,body,action)=>add(node('section',{className:'card'}),node('h3',{text:title}),node('p',{text:body}),action?node('button',{text:action.label,onClick:action.onClick,disabled:action.disabled}):null);
const main=()=>node('main');
const heading=(title)=>node('h1',{text:title});

function legalGate(){const m=main();const box=node('div',{className:'hero'});const link=node('a',{text:'Referência LGPD / ANPD ↗',href:'https://www.gov.br/anpd/pt-br',target:'_blank',rel:'noopener noreferrer'});add(box,node('small',{text:'PRIVACIDADE E CONFIANÇA'}),heading('Antes de começar no Life'),node('p',{text:`Leia e aceite os Termos de Uso e reconheça a Política de Privacidade da versão ${legalVersion}. O aceite é validado pelo servidor de demonstração.`}),add(node('p'),link),node('button',{text:'Li e aceito · continuar',onClick:acceptLegal}));return add(m,box)}
function residentHome(){const m=main();const hero=node('div',{className:'hero'});add(hero,node('small',{text:'SEU DIA NO LIFE'}),heading('Boa noite.'),node('p',{text:`Você tem ${brl(session.cashbackCents)} para usar.`}),node('button',{text:'Usar cashback',onClick:useCashback}));const grid=node('div',{className:'grid'});add(grid,card('📦 Encomenda','1 aguardando retirada'),card('🔑 Visitante','Gerar acesso temporário'),card('🛍️ Marketplace','Produtos e serviços próximos',{label:'Comprar',onClick:()=>go('market')}),card('↗ Insights','Entenda seus gastos e descontos',{label:'Ver dados',onClick:()=>go('insights')}));return add(m,hero,grid)}
function merchantHome(){const m=main();const stats=node('div',{className:'stats'});add(stats,card('Pedidos',String(session.orders)),card('Avaliação','4,9 ★'),card('Cashback','Campanhas ativas'),card('Receita','Sem autorização administrativa neste protótipo'));return add(m,heading('Painel do empreendedor · demonstração visual'),stats)}
function managerHome(){const m=main();const stats=node('div',{className:'stats'});add(stats,card('Participação acumulada',brl(session.condoRevenueCents)),card('Regra','10% da receita Life elegível'),card('Acesso','Somente visual neste protótipo'),card('Transações',String(session.orders)));return add(m,heading('Gestão do condomínio · demonstração visual'),stats)}
function market(){const m=main();add(m,heading('Marketplace'),node('p',{text:'Preço, cashback e saldo são validados pelo servidor.'}));if(ui.role==='resident')add(m,card('Life Wallet',`${brl(session.cashbackCents)} disponíveis. Até 50% da compra pode ser coberto com cashback.`,{label:ui.cashbackMode?'Não usar cashback':'Aplicar cashback',onClick:toggleCashback}));const grid=node('div',{className:'grid'});for(const product of merchants){const used=ui.cashbackMode?Math.min(session.cashbackCents,Math.floor(product.priceCents/2)):0;const section=node('section',{className:'card'});add(section,node('span',{className:'badge',text:`${product.cashback}% cashback`}),node('h3',{text:product.name}),node('p',{text:`${product.category} · ★ ${product.rating}`}),node('strong',{text:`${product.item} · ${brl(product.priceCents)}`}));if(used)add(section,node('p',{text:`Estimativa visual: cashback ${brl(used)} · pagar ${brl(product.priceCents-used)}. O servidor recalcula.`}));add(section,node('button',{text:purchasing?'Processando…':'Comprar no Life',disabled:purchasing||ui.role!=='resident',onClick:()=>buy(product.id)}));grid.append(section)}return add(m,grid)}
function social(){return add(main(),heading('Comunidade'),node('p',{text:'Experiências locais e avaliações verificadas.'}),card('Marina S. · ★★★★★','Resolve Casa foi pontual e resolveu o problema rapidamente. · Compra verificada'))}
function insights(){const m=main();const stats=node('div',{className:'stats'});add(stats,card('Gastos','R$ 1.040,00'),card('Cashback',brl(session.cashbackCents)),card('Pedidos',String(9+session.orders)),card('Economia','R$ 86,40'));return add(m,heading('Insights'),stats,card('Melhor uso do cashback','Resolve Casa tem 10% de cashback e boa reputação perto de você.',{label:'Usar desconto',onClick:useCashback}))}
function profile(){return add(main(),heading('Perfil'),card('Life Wallet',`${brl(session.cashbackCents)} em crédito promocional.`),card('Privacidade','Dados condominiais permanecem privados.'),card('Documentos legais',`Versão validada pelo servidor: ${session.legalAcceptedVersion||'não aceita'}`))}
function nav(){const n=node('nav');for(const [route,label] of [['home','Início'],['market','Comprar'],['social','Social'],['insights','Insights'],['profile','Perfil']])n.append(node('button',{className:ui.route===route?'active':'',text:label,onClick:()=>go(route)}));return n}
function appShell(body){const header=node('header');add(header,node('b',{text:'LIFE'}),node('button',{className:'role',text:`${ui.role==='resident'?'Morador':ui.role==='merchant'?'Empreendedor':'Gestão'} · visual`,onClick:switchRole}));return [header,body,nav()]}
function render(){const root=document.querySelector('#app');if(bootError){const box=node('div',{className:'hero'});add(box,heading('Conexão segura necessária'),node('p',{text:bootError}),node('button',{text:'Tentar novamente',onClick:hydrate}));root.replaceChildren(add(main(),box));return}if(!session){root.textContent='Carregando…';return}if(session.legalAcceptedVersion!==legalVersion){root.replaceChildren(legalGate());return}const body=ui.route==='market'?market():ui.route==='social'?social():ui.route==='insights'?insights():ui.route==='profile'?profile():ui.role==='resident'?residentHome():ui.role==='merchant'?merchantHome():managerHome();root.replaceChildren(...appShell(body))}
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
render();hydrate();
