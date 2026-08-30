const brl=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
const LEGAL_VERSION='2026-08-30';
const merchants=[
{id:'cesta-fresh',name:'Casa Verde Market',category:'Mercado',rating:4.9,cashback:8,item:'Cesta Fresh',priceCents:6490},
{id:'corte-premium',name:'Studio Nômade',category:'Beleza',rating:4.8,cashback:12,item:'Corte Premium',priceCents:5500},
{id:'visita-tecnica',name:'Resolve Casa',category:'Serviços',rating:4.9,cashback:10,item:'Visita técnica',priceCents:7990}
];
const uiDefault={route:'home',role:'resident',cashbackMode:false};
let ui={...uiDefault,...JSON.parse(localStorage.getItem('life-ui')||'{}')};
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
  if(purchasing||!session)return;
  purchasing=true;render();
  try{
    const payload=await request('/api/checkout/quote',{method:'POST',headers:{'idempotency-key':crypto.randomUUID()},body:JSON.stringify({productId:id,useCashback:ui.cashbackMode})});
    session=payload.session;ui.cashbackMode=false;saveUi();
    const a=payload.allocation;
    alert(`Pagamento MVP aprovado: ${brl(a.customerPayableCents)}. Cashback usado: ${brl(a.cashbackUsedCents)} · Novo cashback: ${brl(a.cashbackEarnedCents)} · Condomínio: ${brl(a.condominiumShareCents)}`);
  }catch{alert('Não foi possível concluir a compra simulada.');}
  finally{purchasing=false;render();}
}
const nav=()=>`<nav>${[['home','Início'],['market','Comprar'],['social','Social'],['insights','Insights'],['profile','Perfil']].map(([k,l])=>`<button class="${ui.route===k?'active':''}" onclick="go('${k}')">${l}</button>`).join('')}</nav>`;
const card=(title,body,action='')=>`<section class="card"><h3>${title}</h3><p>${body}</p>${action}</section>`;
function legalGate(){return `<main><div class="hero"><small>PRIVACIDADE E CONFIANÇA</small><h1>Antes de começar no Life</h1><p>Leia e aceite os Termos de Uso e reconheça a Política de Privacidade da versão ${legalVersion}. O aceite é validado pelo servidor de demonstração.</p><p><a href="https://www.gov.br/anpd/pt-br" target="_blank" rel="noopener noreferrer">Referência LGPD / ANPD ↗</a></p><button onclick="acceptLegal()">Li e aceito · continuar</button></div></main>`}
function residentHome(){return `<div class="hero"><small>SEU DIA NO LIFE</small><h1>Boa noite.<br>Você tem ${brl(session.cashbackCents)} para usar.</h1><button onclick="useCashback()">Usar cashback</button></div><div class="grid">${card('📦 Encomenda','1 aguardando retirada')}${card('🔑 Visitante','Gerar acesso temporário')}${card('🛍️ Marketplace','Produtos e serviços próximos','<button onclick="go(\'market\')">Comprar</button>')}${card('↗ Insights','Entenda seus gastos e descontos','<button onclick="go(\'insights\')">Ver dados</button>')}</div>`}
function merchantHome(){return `<h1>Painel do empreendedor · demonstração visual</h1><div class="stats">${card('Pedidos',String(session.orders))}${card('Avaliação','4,9 ★')}${card('Cashback','Campanhas ativas')}${card('Receita','Sem autorização administrativa neste protótipo')}</div>`}
function managerHome(){return `<h1>Gestão do condomínio · demonstração visual</h1><div class="stats">${card('Participação acumulada',brl(session.condoRevenueCents))}${card('Regra','10% da receita Life elegível')}${card('Acesso','Somente visual neste protótipo')}${card('Transações',String(session.orders))}</div>`}
function market(){return `<h1>Marketplace</h1><p>Preço, cashback e saldo são validados pelo servidor.</p>${ui.role==='resident'?card('Life Wallet',`${brl(session.cashbackCents)} disponíveis. Até 50% da compra pode ser coberto com cashback.`,`<button onclick="toggleCashback()">${ui.cashbackMode?'Não usar cashback':'Aplicar cashback'}</button>`):''}<div class="grid">${merchants.map(m=>{const used=ui.cashbackMode?Math.min(session.cashbackCents,Math.floor(m.priceCents/2)):0;return `<section class="card"><span class="badge">${m.cashback}% cashback</span><h3>${m.name}</h3><p>${m.category} · ★ ${m.rating}</p><strong>${m.item} · ${brl(m.priceCents)}</strong>${used?`<p>Estimativa visual: cashback ${brl(used)} · pagar ${brl(m.priceCents-used)}. O servidor recalcula.</p>`:''}<button ${purchasing||ui.role!=='resident'?'disabled':''} onclick="buy('${m.id}')">${purchasing?'Processando…':'Comprar no Life'}</button></section>`}).join('')}</div>`}
function social(){return `<h1>Comunidade</h1><p>Experiências locais e avaliações verificadas.</p>${card('Marina S. · ★★★★★','Resolve Casa foi pontual e resolveu o problema rapidamente. · Compra verificada')}`}
function insights(){return `<h1>Insights</h1><div class="stats">${card('Gastos','R$ 1.040,00')}${card('Cashback',brl(session.cashbackCents))}${card('Pedidos',String(9+session.orders))}${card('Economia','R$ 86,40')}</div>${card('Melhor uso do cashback','Resolve Casa tem 10% de cashback e boa reputação perto de você.','<button onclick="useCashback()">Usar desconto</button>')}`}
function profile(){return `<h1>Perfil</h1>${card('Life Wallet',`${brl(session.cashbackCents)} em crédito promocional.`)}${card('Privacidade','Dados condominiais permanecem privados.')}${card('Documentos legais',`Versão validada pelo servidor: ${session.legalAcceptedVersion||'não aceita'}`)}`}
function render(){
  const root=document.querySelector('#app');
  if(bootError){root.textContent='';const main=document.createElement('main');const box=document.createElement('div');box.className='hero';const h=document.createElement('h1');h.textContent='Conexão segura necessária';const p=document.createElement('p');p.textContent=bootError;const b=document.createElement('button');b.textContent='Tentar novamente';b.onclick=hydrate;box.append(h,p,b);main.append(box);root.append(main);return}
  if(!session){root.textContent='Carregando…';return}
  if(session.legalAcceptedVersion!==legalVersion){root.innerHTML=legalGate();return}
  const body=ui.route==='market'?market():ui.route==='social'?social():ui.route==='insights'?insights():ui.route==='profile'?profile():ui.role==='resident'?residentHome():ui.role==='merchant'?merchantHome():managerHome();
  root.innerHTML=`<header><b>LIFE</b><button class="role" onclick="switchRole()">${ui.role==='resident'?'Morador':ui.role==='merchant'?'Empreendedor':'Gestão'} · visual</button></header><main>${body}</main>${nav()}`;
}
Object.assign(window,{go,buy,useCashback,toggleCashback,acceptLegal,switchRole});
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
render();hydrate();
