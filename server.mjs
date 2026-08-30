import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { calculateAllocation } from './prototype/finance.js';
const root=join(process.cwd(),'prototype');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.json':'application/json'};
const json=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data))};
const body=async req=>{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>64_000)throw new Error('PAYLOAD_TOO_LARGE')}return raw?JSON.parse(raw):{}};
createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(req.url.split('?')[0]);
    if(pathname==='/api/health')return json(res,200,{status:'ok',service:'life-mvp',time:new Date().toISOString()});
    if(pathname==='/api/checkout/quote'&&req.method==='POST'){
      const input=await body(req);
      const allocation=calculateAllocation({gross:Number(input.gross),cashbackRate:Number(input.cashbackRate||0)});
      return json(res,200,{allocation,provider:'mock',currency:'BRL'});
    }
    let path=pathname==='/'?'/index.html':pathname;
    path=normalize(path).replace(/^(\.\.[/\\])+/, '');
    let file=join(root,path);
    try { if((await stat(file)).isDirectory()) file=join(file,'index.html'); } catch {}
    const content=await readFile(file);
    res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-cache'});res.end(content);
  } catch(err){
    if(req.url?.startsWith('/api/'))return json(res,400,{error:{code:err?.message||'BAD_REQUEST',message:'Não foi possível processar a solicitação.'}});
    const content=await readFile(join(root,'index.html'));res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(content);
  }
}).listen(4173,'0.0.0.0',()=>console.log('Life MVP: http://localhost:4173'));
