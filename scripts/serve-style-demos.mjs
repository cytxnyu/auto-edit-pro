import {createServer} from 'node:http';
import {createReadStream, existsSync, statSync} from 'node:fs';
import {extname, resolve, sep} from 'node:path';
const root=resolve(process.argv[2] || 'examples/style-demos/rendered');
const port=Number(process.argv[3] || 4178);
if(!existsSync(resolve(root,'index.html'))) throw new Error('Run demo:styles first or provide its output directory.');
const mime={'.html':'text/html; charset=utf-8','.mp4':'video/mp4','.png':'image/png','.json':'application/json'};
createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if((file!==root&&!file.startsWith(root+sep))||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404).end();return;}
  const size=statSync(file).size;
  const range=req.headers.range;
  const headers={'Content-Type':mime[extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store'};
  if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m){res.writeHead(416).end();return;}const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),size-1):size-1;if(start> end||start>=size){res.writeHead(416).end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});createReadStream(file,{start,end}).pipe(res);}
  else{res.writeHead(200,{...headers,'Content-Length':size});createReadStream(file).pipe(res);}
}).listen(port,'127.0.0.1',()=>console.log(`STYLE_DEMOS http://127.0.0.1:${port}`));
