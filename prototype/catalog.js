export const DEMO_PRODUCTS = Object.freeze({
  'cesta-fresh': Object.freeze({id:'cesta-fresh',merchant:'Casa Verde Market',category:'Mercado',item:'Cesta Fresh',priceCents:6490,cashbackBps:800,rating:4.9}),
  'corte-premium': Object.freeze({id:'corte-premium',merchant:'Studio Nômade',category:'Beleza',item:'Corte Premium',priceCents:5500,cashbackBps:1200,rating:4.8}),
  'visita-tecnica': Object.freeze({id:'visita-tecnica',merchant:'Resolve Casa',category:'Serviços',item:'Visita técnica',priceCents:7990,cashbackBps:1000,rating:4.9}),
});

export const PUBLIC_PRODUCTS=Object.freeze(Object.values(DEMO_PRODUCTS).map(({cashbackBps,priceCents,...product})=>Object.freeze({...product,priceCents,cashbackPercent:cashbackBps/100})));
