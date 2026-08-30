const brl=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const merchants=[
{id:1,name:'Casa Verde Market',category:'Mercado',rating:4.9,cashback:8,item:'Cesta Fresh',price:64.9},
{id:2,name:'Studio Nômade',category:'Beleza',rating:4.8,cashback:12,item:'Corte Premium',price:55},
{id:3,name:'Resolve Casa',category:'Serviços',rating:4.9,cashback:10,item:'Visita técnica',price:79.9}
];
const initial={route:'home',role:'resident',cashback:27.8,orders:0,condoRevenue:0,posts:[{author:'Marina S.',text:'Resolve Casa foi pontual e resolveu o problema rapidamente.',rating:5}]};
const loadState=()=>{
  try{return JSON.parse(localStorage.getItem('life-state')||'{}')||{}}
  catch{return {}}
};
let state={...initial,...loadState()};
const escapeHtml=value=>String(value).replace(/[&<>"']/g,character=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[character]));
const save=()=>localStorage.setItem('life-state',JSON.stringify(state));
const go=route=>{state.route=route;save();render()};
const switchRole=()=>{state.role=state.role==='resident'?'merchant':state.role==='merchant'?'manager':'resident';state.route='home';save();render()};
async function buy(id){
  const m=merchants.find(x=>x.id===id);
  if(!m)return;
  try{
    const res=await fetch('/api/checkout/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({gross:m.price,cashbackRate:m.cashback/100})});
    if(!res.ok)throw new Error('QUOTE_FAILED');
    const {allocation}=await res.json();
    state.cashback=+(state.cashback+allocation.cashbackEarned).toFixed(2);
    state.orders+=1;
    state.condoRevenue=+(state.condoRevenue+allocation.condominiumShare).toFixed(2);
    save();
    alert(`Pagamento MVP aprovado. Cashback: ${brl(allocation.cashbackEarned)} · Condomínio: ${brl(allocation.condominiumShare)}`);
    render();
  }catch{
    alert('Não foi possível obter a cotação. Nenhuma alteração foi aplicada.');
  }
}
const nav=()=>`<nav>${[['home','Início'],['market','Comprar'],['social','Social'],['insights','Insights'],['profile','Perfil']].map(([k,l])=>`<button class="${state.route===k?'active':''}" onclick="go('${k}')">${l}</button>`).join('')}</nav>`;
const card=(title,body,action='')=>`<section class="card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p>${action}</section>`;
function residentHome(){return `<div class="hero"><small>SEU DIA NO LIFE</small><h1>Boa noite.<br>Você tem ${brl(state.cashback)} para usar.</h1><button onclick="go('market')">Usar cashback</button></div><div class="grid">${card('📦 Encomenda','1 aguardando retirada')}${card('🔑 Visitante','Gerar acesso temporário')}${card('🛍️ Marketplace','Produtos e serviços próximos','<button onclick="go(\'market\')">Comprar</button>')}${card('↗ Insights','Entenda seus gastos e descontos','<button onclick="go(\'insights\')">Ver dados</button>')}</div>`}
function merchantHome(){return `<h1>Painel do empreendedor</h1><div class="stats">${card('Pedidos',String(state.orders))}${card('Avaliação','4,9 ★')}${card('Cashback','Campanhas ativas')}${card('Receita','Visão demonstrativa')}</div>${card('Loja','Gerencie produtos, serviços, agenda e reputação pelo Life.')}`}
function managerHome(){return `<h1>Gestão do condomínio</h1><div class="stats">${card('Participação acumulada',brl(state.condoRevenue))}${card('Regra','10% da receita Life elegível')}${card('Moradores ativos','128')}${card('Transações',String(state.orders))}</div>${card('Transparência','GMV, receita Life e participação do condomínio devem permanecer separados.')}`}
function market(){return `<h1>Marketplace</h1><p>Pagamento exclusivamente dentro do Life.</p><div class="grid">${merchants.map(m=>`<section class="card"><span class="badge">${m.cashback}% cashback</span><h3>${escapeHtml(m.name)}</h3><p>${escapeHtml(m.category)} · ★ ${m.rating}</p><strong>${escapeHtml(m.item)} · ${brl(m.price)}</strong><button onclick="buy(${m.id})">Comprar no Life</button></section>`).join('')}</div>`}
function social(){return `<h1>Comunidade</h1><p>Experiências locais e avaliações verificadas.</p>${(Array.isArray(state.posts)?state.posts:[]).map(p=>card(`${p.author} · ${'★'.repeat(Math.max(0,Math.min(5,Number(p.rating)||0)))}`,`${p.text} · Compra verificada`)).join('')}`}
function insights(){return `<h1>Insights</h1><div class="stats">${card('Gastos','R$ 1.040,00')}${card('Cashback',brl(state.cashback))}${card('Pedidos',String(9+state.orders))}${card('Economia','R$ 86,40')}</div>${card('Melhor uso do cashback','Você costuma contratar serviços residenciais. A Resolve Casa tem 10% de cashback e boa reputação perto de você.','<button onclick="go(\'market\')">Usar desconto</button>')}`}
function profile(){return `<h1>Gabriel</h1>${card('Life Wallet',`${brl(state.cashback)} em crédito promocional para uso dentro do Life.`)}${card('Privacidade','Dados condominiais permanecem privados. Preferências sociais e comerciais devem ser controláveis.')}${card('Explorar','Links externos relacionados a consumo, LGPD e vida condominial.','<a href="https://www.gov.br/anpd/" target="_blank" rel="noopener noreferrer">Abrir ANPD ↗</a>')}`}
function render(){let body=state.route==='market'?market():state.route==='social'?social():state.route==='insights'?insights():state.route==='profile'?profile():state.role==='resident'?residentHome():state.role==='merchant'?merchantHome():managerHome();document.querySelector('#app').innerHTML=`<header><b>LIFE</b><button class="role" onclick="switchRole()">${state.role==='resident'?'Morador':state.role==='merchant'?'Empreendedor':'Gestão'} · trocar</button></header><main>${body}</main>${nav()}`}
Object.assign(window,{go,buy,switchRole});
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
render();
