const brl = cents => new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(cents / 100);
const FALLBACK_LEGAL_VERSION = '2026-08-30';
const legalDocuments = [
  {key: 'terms', document: 'terms-of-use', label: 'Termos de Uso', path: `/legal/terms-${FALLBACK_LEGAL_VERSION}.html`},
  {key: 'privacy', document: 'privacy-policy', label: 'Política de Privacidade', path: `/legal/privacy-${FALLBACK_LEGAL_VERSION}.html`},
];
const initialUi = {route: 'home', role: 'resident', cashbackMode: false};
let ui = initialUi;
try { ui = {...initialUi, ...JSON.parse(localStorage.getItem('life-ui') || '{}')}; } catch {}
let session = null;
let legalVersion = FALLBACK_LEGAL_VERSION;
let products = [];
let purchasing = false;
let bootError = '';
let legalSelection = {terms: false, privacy: false};

const saveUi = () => {
  try { localStorage.setItem('life-ui', JSON.stringify(ui)); } catch {}
};
const hasLegalConsent = value => value?.legalAcceptedVersion === legalVersion;
const request = async (path, options = {}) => {
  const headers = {...(options.body ? {'content-type': 'application/json'} : {}), ...(options.headers || {})};
  const response = await fetch(path, {...options, credentials: 'same-origin', headers});
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.code || 'REQUEST_FAILED');
    error.status = response.status;
    throw error;
  }
  return payload;
};

async function hydrate() {
  try {
    const [sessionPayload, catalogPayload] = await Promise.all([request('/api/session'), request('/api/catalog')]);
    session = sessionPayload.session;
    legalVersion = sessionPayload.legalVersion;
    products = Array.isArray(catalogPayload.products) ? catalogPayload.products : [];
    bootError = '';
  } catch {
    session = null;
    bootError = 'Não foi possível estabelecer uma sessão segura com o servidor.';
  }
  render();
}

async function acceptLegal() {
  if (!legalSelection.terms || !legalSelection.privacy) {
    alert('Leia e marque os dois documentos para continuar.');
    return;
  }
  try {
    const payload = await request('/api/legal/accept', {method: 'POST', body: JSON.stringify({version: legalVersion})});
    session = payload.session;
    legalSelection = {terms: false, privacy: false};
    render();
  } catch {
    alert('Não foi possível registrar o aceite no servidor.');
  }
}

const go = route => {
  if (!hasLegalConsent(session)) return;
  ui = {...ui, route, cashbackMode: route === 'market' ? ui.cashbackMode : false};
  saveUi();
  render();
};
const toggleLegal = (key, checked) => {
  if (!Object.prototype.hasOwnProperty.call(legalSelection, key) || hasLegalConsent(session)) return;
  legalSelection = {...legalSelection, [key]: typeof checked === 'boolean' ? checked : !legalSelection[key]};
  render();
};
const useCashback = () => { ui = {...ui, route: 'market', cashbackMode: true}; saveUi(); render(); };
const toggleCashback = () => { ui = {...ui, cashbackMode: !ui.cashbackMode}; saveUi(); render(); };
const switchRole = () => { ui = {...ui, role: ui.role === 'resident' ? 'merchant' : ui.role === 'merchant' ? 'manager' : 'resident', route: 'home', cashbackMode: false}; saveUi(); render(); };

function idempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `life-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function buy(id) {
  if (purchasing || !session || ui.role !== 'resident' || !hasLegalConsent(session)) return;
  purchasing = true;
  render();
  try {
    const payload = await request('/api/checkout/commit', {
      method: 'POST',
      headers: {'idempotency-key': idempotencyKey()},
      body: JSON.stringify({productId: id, useCashback: ui.cashbackMode}),
    });
    session = payload.session;
    ui = {...ui, cashbackMode: false};
    saveUi();
    const allocation = payload.allocation;
    alert(`Pagamento MVP aprovado: ${brl(allocation.customerPayableCents)}. Cashback usado: ${brl(allocation.cashbackUsedCents)} · Novo cashback: ${brl(allocation.cashbackEarnedCents)} · Condomínio: ${brl(allocation.condominiumShareCents)}`);
  } catch {
    alert('Não foi possível concluir a compra simulada. Nenhuma alteração foi aplicada.');
  } finally {
    purchasing = false;
    render();
  }
}

const node = (tag, {className, text, onClick, disabled, href, target, rel} = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  if (onClick) element.addEventListener('click', onClick);
  if (disabled) element.disabled = true;
  if (href) element.href = href;
  if (target) element.target = target;
  if (rel) element.rel = rel;
  return element;
};
const add = (parent, ...children) => { for (const child of children.flat()) if (child) parent.append(child); return parent; };
const main = () => node('main');
const heading = title => node('h1', {text: title});
const card = (title, body, action) => add(node('section', {className: 'card'}), node('h3', {text: title}), node('p', {text: body}), action ? node('button', {text: action.label, onClick: action.onClick, disabled: action.disabled}) : null);

function legalGate() {
  const box = node('div', {className: 'hero'});
  const links = node('div', {className: 'legal-links'});
  for (const document of legalDocuments) add(links, node('a', {text: `Ler ${document.label} · versão ${legalVersion} ↗`, href: document.path, target: '_blank', rel: 'noopener noreferrer'}));
  const terms = node('label');
  add(terms, node('input', {onClick: () => toggleLegal('terms', terms.querySelector('input').checked)}), ` Li e aceito os ${legalDocuments[0].label} · ${legalVersion}.`);
  terms.querySelector('input').type = 'checkbox';
  terms.querySelector('input').checked = legalSelection.terms;
  const privacy = node('label');
  add(privacy, node('input', {onClick: () => toggleLegal('privacy', privacy.querySelector('input').checked)}), ` Li e aceito a ${legalDocuments[1].label} · ${legalVersion}.`);
  privacy.querySelector('input').type = 'checkbox';
  privacy.querySelector('input').checked = legalSelection.privacy;
  return add(main(), add(node('header'), node('b', {text: 'LIFE'})), add(box,
    node('small', {text: 'PRIVACIDADE E CONFIANÇA'}), heading('Antes de começar no Life'),
    node('p', {text: `Leia os dois documentos do Life. O aceite é validado pelo servidor de demonstração na versão ${legalVersion}.`}), links, terms, privacy,
    node('button', {text: 'Aceitar e continuar', onClick: acceptLegal, disabled: !legalSelection.terms || !legalSelection.privacy}),
  ));
}

function residentHome() {
  const hero = node('div', {className: 'hero'});
  add(hero, node('small', {text: 'SEU DIA NO LIFE'}), heading('Boa noite.'), node('p', {text: `Você tem ${brl(session.cashbackCents)} para usar.`}), node('button', {text: 'Usar cashback', onClick: useCashback}));
  const grid = node('div', {className: 'grid'});
  add(grid, card('📦 Encomenda', '1 aguardando retirada'), card('🔑 Visitante', 'Gerar acesso temporário'), card('🛍️ Marketplace', 'Produtos e serviços próximos', {label: 'Comprar', onClick: () => go('market')}), card('↗ Insights', 'Entenda seus gastos e descontos', {label: 'Ver dados', onClick: () => go('insights')}));
  return add(main(), hero, grid);
}
function merchantHome() { return add(main(), heading('Painel do empreendedor · demonstração visual'), card('Pedidos', String(session.orders)), card('Avaliação', '4,9 ★'), card('Cashback', 'Campanhas ativas')); }
function managerHome() { return add(main(), heading('Gestão do condomínio · demonstração visual'), card('Participação acumulada', brl(session.condoRevenueCents)), card('Regra', '10% da receita Life elegível'), card('Transações', String(session.orders))); }

function market() {
  const m = main();
  add(m, heading('Marketplace'), node('p', {text: 'Preço, cashback e saldo são validados pelo servidor.'}));
  if (ui.role === 'resident') add(m, card('Life Wallet', `${brl(session.cashbackCents)} disponíveis. Até 50% da compra pode ser coberto com cashback.`, {label: ui.cashbackMode ? 'Não usar cashback' : 'Aplicar cashback', onClick: toggleCashback}));
  const grid = node('div', {className: 'grid'});
  for (const product of products) {
    const used = ui.cashbackMode ? Math.min(session.cashbackCents, Math.floor(product.priceCents / 2)) : 0;
    const section = node('section', {className: 'card'});
    add(section, node('span', {className: 'badge', text: `${product.cashbackPercent}% cashback`}), node('h3', {text: product.merchant}), node('p', {text: `${product.category} · ★ ${product.rating}`}), node('strong', {text: `${product.item} · ${brl(product.priceCents)}`}));
    if (used) add(section, node('p', {text: `Estimativa visual: cashback ${brl(used)} · pagar ${brl(product.priceCents - used)}. O servidor recalcula.`}));
    add(section, node('button', {text: purchasing ? 'Processando…' : 'Comprar no Life', disabled: purchasing || ui.role !== 'resident', onClick: () => buy(product.id)}));
    grid.append(section);
  }
  return add(m, grid);
}
function social() { return add(main(), heading('Comunidade'), node('p', {text: 'Experiências locais e avaliações verificadas.'}), card('Marina S. · ★★★★★', 'Resolve Casa foi pontual e resolveu o problema rapidamente. · Compra verificada')); }
function insights() { return add(main(), heading('Insights'), card('Gastos', 'R$ 1.040,00'), card('Cashback', brl(session.cashbackCents)), card('Pedidos', String(9 + session.orders)), card('Economia', 'R$ 86,40'), card('Melhor uso do cashback', 'Resolve Casa tem 10% de cashback e boa reputação perto de você.', {label: 'Usar desconto', onClick: useCashback})); }
function profile() { return add(main(), heading('Perfil'), card('Life Wallet', `${brl(session.cashbackCents)} em crédito promocional.`), card('Privacidade', 'Dados condominiais permanecem privados.'), card('Documentos jurídicos', `Versão validada pelo servidor: ${session.legalAcceptedVersion}`, add(node('div', {className: 'legal-links'}), ...legalDocuments.map(document => node('a', {text: `Abrir ${document.label} ↗`, href: document.path, target: '_blank', rel: 'noopener noreferrer'}))))); }
function nav() { const element = node('nav'); for (const [route, label] of [['home', 'Início'], ['market', 'Comprar'], ['social', 'Social'], ['insights', 'Insights'], ['profile', 'Perfil']]) add(element, node('button', {className: ui.route === route ? 'active' : '', text: label, onClick: () => go(route)})); return element; }
function appShell(body) { const header = node('header'); add(header, node('b', {text: 'LIFE'}), node('button', {className: 'role', text: `${ui.role === 'resident' ? 'Morador' : ui.role === 'merchant' ? 'Empreendedor' : 'Gestão'} · visual`, onClick: switchRole})); return [header, body, nav()]; }

function render() {
  const root = document.querySelector('#app');
  if (bootError) { const box = node('div', {className: 'hero'}); add(box, heading('Conexão segura necessária'), node('p', {text: bootError}), node('button', {text: 'Tentar novamente', onClick: hydrate})); root.replaceChildren(add(main(), box)); return; }
  if (!session) { root.textContent = 'Carregando…'; return; }
  if (!hasLegalConsent(session)) { root.replaceChildren(legalGate()); return; }
  const body = ui.route === 'market' ? market() : ui.route === 'social' ? social() : ui.route === 'insights' ? insights() : ui.route === 'profile' ? profile() : ui.role === 'resident' ? residentHome() : ui.role === 'merchant' ? merchantHome() : managerHome();
  root.replaceChildren(...appShell(body));
}

Object.assign(window, {go, buy, switchRole, toggleLegal, acceptLegal});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
render();
hydrate();
