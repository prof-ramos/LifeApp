const brl=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const LEGAL_VERSION='2026-08-30';
const merchants=[
{id:1,name:'Casa Verde Market',category:'Mercado',rating:4.9,cashback:8,item:'Cesta Fresh',price:64.9},
{id:2,name:'Studio Nômade',category:'Beleza',rating:4.8,cashback:12,item:'Corte Premium',price:55},
{id:3,name:'Resolve Casa',category:'Serviços',rating:4.9,cashback:10,item:'Visita técnica',price:79.9}
];
const initial={route:'home',role:'resident',cashback:27.8,orders:0,condoRevenue:0,legalAcceptedVersion:null,cashbackMode:false,posts:[{author:'Marina S.',text:'Resolve Casa foi pontual e resolveu o problema rapidamente.',rating:5}]};
let state={...initial,...JSON.parse(localStorage.getItem('life-state')||'{}'),purchasing:false};
const save=()=>localStorage.setItem('life-state',JSON.stringify({...state,purchasing:false}));
const go=route=>{state.route=route;if(route!=='market')state.cashbackMode=false;save();render()};
const useCashback=()=>{state.cashbackMode=true;state.route='market';save();render()};
const toggleCashback=()=>{state.cashbackMode=!state.cashbackMode;save();render()};
const acceptLegal=()=>{state.legalAcceptedVersion=LEGAL_VERSION;save();render()};
const switchRole=()=>{state.role=state.role==='resident'?'merchant':state.role==='merchant'?'manager':'resident';state.route='home';state.cashbackMode=false;save();render()};
/**
 * Completes a marketplace purchase for the specified merchant.
 * @param {string} id - The merchant identifier.
 */
async function buy(id){
  if(state.purchasing)return;
  const m=merchants.find(x=>x.id===id);
  const cashbackUsed=state.cashbackMode?Math.min(state.cashback,m.price*0.5):0;
  state.purchasing=true;render();
  try{
    const res=await fetch('/api/checkout/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({gross:m.price,cashbackRate:m.cashback/100,cashbackUsed})});
    const payload=await res.json();
    if(!res.ok)throw new Error(payload?.error?.code||'CHECKOUT_FAILED');
    const {allocation}=payload;
    state.cashback=+(state.cashback-allocation.cashbackUsed+allocation.cashbackEarned).toFixed(2);
    state.orders+=1;
    state.condoRevenue=+(state.condoRevenue+allocation.condominiumShare).toFixed(2);
    state.cashbackMode=false;
    save();
    alert(`Pagamento MVP aprovado: ${brl(allocation.customerPayable)}. Cashback usado: ${brl(allocation.cashbackUsed)} · Novo cashback: ${brl(allocation.cashbackEarned)} · Condomínio: ${brl(allocation.condominiumShare)}`);
  }catch{alert('Não foi possível concluir a compra simulada.');}
  finally{state.purchasing=false;render();}
}
const nav=()=>`<nav>${[['home','Início'],['market','Comprar'],['social','Social'],['insights','Insights'],['profile','Perfil']].map(([k,l])=>`<button class="${state.route===k?'active':''}" onclick="go('${k}')">${l}</button>`).join('')}</nav>`;
const card=(title,body,action='')=>`<section class="card"><h3>${title}</h3><p>${body}</p>${action}</section>`;
/**
 * Presents the legal acceptance screen required before accessing the application.
 * @return {string} HTML markup for the legal acceptance screen.
 */
function legalGate(){return `<main><div class="hero"><small>PRIVACIDADE E CONFIANÇA</small><h1>Antes de começar no Life</h1><p>Leia e aceite os Termos de Uso e reconheça a Política de Privacidade da versão ${LEGAL_VERSION}. Este MVP registra o aceite localmente; em produção a evidência será registrada no backend.</p><p><a href="https://www.gov.br/anpd/pt-br" target="_blank" rel="noopener noreferrer">Referência LGPD / ANPD ↗</a></p><button onclick="acceptLegal()">Li e aceito · continuar</button></div></main>`}
/**
 * Generates the resident home view with cashback information and quick-access cards.
 * @return {string} The rendered HTML for the resident home view.
 */
function residentHome(){return `<div class="hero"><small>SEU DIA NO LIFE</small><h1>Boa noite.<br>Você tem ${brl(state.cashback)} para usar.</h1><button onclick="useCashback()">Usar cashback</button></div><div class="grid">${card('📦 Encomenda','1 aguardando retirada')}${card('🔑 Visitante','Gerar acesso temporário')}${card('🛍️ Marketplace','Produtos e serviços próximos','<button onclick="go(\'market\')">Comprar</button>')}${card('↗ Insights','Entenda seus gastos e descontos','<button onclick="go(\'insights\')">Ver dados</button>')}</div>`}
/**
 * Renders the merchant dashboard with order, rating, cashback, revenue, and store management information.
 * @return {string} The merchant dashboard markup.
 */
function merchantHome(){return `<h1>Painel do empreendedor</h1><div class="stats">${card('Pedidos',String(state.orders))}${card('Avaliação','4,9 ★')}${card('Cashback','Campanhas ativas')}${card('Receita','Visão demonstrativa')}</div>${card('Loja','Gerencie produtos, serviços, agenda e reputação pelo Life.')}`}
/**
 * Render the condominium manager dashboard.
 * @return {string} The dashboard markup with participation, revenue rule, resident, transaction, and transparency information.
 */
function managerHome(){return `<h1>Gestão do condomínio</h1><div class="stats">${card('Participação acumulada',brl(state.condoRevenue))}${card('Regra','10% da receita Life elegível')}${card('Moradores ativos','128')}${card('Transações',String(state.orders))}</div>${card('Transparência','GMV, receita Life e participação do condomínio devem permanecer separados.')}`}
/**
 * Renders the marketplace view with merchant offers, prices, cashback options, and purchase controls.
 * @return {string} The marketplace HTML markup.
 */
function market(){return `<h1>Marketplace</h1><p>Pagamento exclusivamente dentro do Life.</p>${state.role==='resident'?card('Life Wallet',`${brl(state.cashback)} disponíveis. No MVP, até 50% do valor da compra pode ser coberto com cashback.`,`<button onclick="toggleCashback()">${state.cashbackMode?'Não usar cashback':'Aplicar cashback'}</button>`):''}<div class="grid">${merchants.map(m=>{const used=state.cashbackMode?Math.min(state.cashback,m.price*0.5):0;return `<section class="card"><span class="badge">${m.cashback}% cashback</span><h3>${m.name}</h3><p>${m.category} · ★ ${m.rating}</p><strong>${m.item} · ${brl(m.price)}</strong>${used?`<p>Cashback aplicado: ${brl(used)} · pagar ${brl(m.price-used)}</p>`:''}<button ${state.purchasing?'disabled':''} onclick="buy(${m.id})">${state.purchasing?'Processando…':'Comprar no Life'}</button></section>`}).join('')}</div>`}
/**
 * Render the community page with verified local experiences and ratings.
 * @returns {string} HTML markup containing the community heading and post cards.
 */
function social(){return `<h1>Comunidade</h1><p>Experiências locais e avaliações verificadas.</p>${state.posts.map(p=>card(`${p.author} · ${'★'.repeat(p.rating)}`,p.text+' · Compra verificada')).join('')}`}
/**
 * Render the spending insights view with activity metrics and a cashback recommendation.
 * @return {string} The generated HTML markup.
 */
function insights(){return `<h1>Insights</h1><div class="stats">${card('Gastos','R$ 1.040,00')}${card('Cashback',brl(state.cashback))}${card('Pedidos',String(9+state.orders))}${card('Economia','R$ 86,40')}</div>${card('Melhor uso do cashback','Você costuma contratar serviços residenciais. A Resolve Casa tem 10% de cashback e boa reputação perto de você.','<button onclick="useCashback()">Usar desconto</button>')}`}
/**
 * Renders the user's profile view with wallet information, privacy details, legal acceptance status, and an ANPD link.
 * @return {string} The profile view markup.
 */
function profile(){return `<h1>Gabriel</h1>${card('Life Wallet',`${brl(state.cashback)} em crédito promocional para uso dentro do Life.`)}${card('Privacidade','Dados condominiais permanecem privados. Preferências sociais e comerciais devem ser controláveis.')}${card('Documentos legais',`Versão aceita: ${state.legalAcceptedVersion||'não aceita'}`)}${card('Explorar','Links externos relacionados a consumo, LGPD e vida condominial.','<a href="https://www.gov.br/anpd/" target="_blank" rel="noopener noreferrer">Abrir ANPD ↗</a>')}`}
/**
 * Renders the current application view and enforces legal acceptance before access.
 */
function render(){
  if(state.legalAcceptedVersion!==LEGAL_VERSION){document.querySelector('#app').innerHTML=legalGate();return;}
  const body=state.route==='market'?market():state.route==='social'?social():state.route==='insights'?insights():state.route==='profile'?profile():state.role==='resident'?residentHome():state.role==='merchant'?merchantHome():managerHome();
  document.querySelector('#app').innerHTML=`<header><b>LIFE</b><button class="role" onclick="switchRole()">${state.role==='resident'?'Morador':state.role==='merchant'?'Empreendedor':'Gestão'} · trocar</button></header><main>${body}</main>${nav()}`;
}
Object.assign(window,{go,buy,useCashback,toggleCashback,acceptLegal,switchRole});
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
render();
