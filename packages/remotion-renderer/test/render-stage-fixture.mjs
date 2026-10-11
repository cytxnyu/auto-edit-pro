import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
const output=path.resolve(process.argv[2]);
const inputProps=JSON.parse(await fs.readFile(path.join(output,'props.json'),'utf8'));
const serveUrl=await bundle({entryPoint:path.resolve('packages/remotion-renderer/src/index.ts'),publicDir:path.join(output,'public')});
const browser=await openBrowser('chrome',{logLevel:'error'});
const composition=await selectComposition({serveUrl,id:'VideoPackaging',inputProps,puppeteerInstance:browser});
const results=[];
try {
  for (const frame of [35,72,83,84,96,113,114,137,138,155,156,179,84,35]) {
    const duplicate=results.some((x)=>x.frame===frame);
    const filename=`frame-${String(frame).padStart(3,'0')}${duplicate?'-repeat':''}.png`;
    const location=path.join(output,filename);
    await renderStill({serveUrl,composition,inputProps,output:location,frame,scale:.5,puppeteerInstance:browser,logLevel:'error'});
    const sha256=createHash('sha256').update(await fs.readFile(location)).digest('hex');
    results.push({frame,filename,sha256});
  }
  await renderMedia({serveUrl,composition,inputProps,outputLocation:path.join(output,'stage-fixture.mp4'),codec:'h264',crf:16,scale:.5,muted:true,concurrency:2,puppeteerInstance:browser,logLevel:'error'});
  for (const frame of [35,84]) {
    if(new Set(results.filter(x=>x.frame===frame).map(x=>x.sha256)).size!==1) throw new Error(`Out-of-order duplicate frame ${frame} mismatch`);
  }
  await fs.writeFile(path.join(output,'RENDER_VERIFICATION.json'),JSON.stringify({status:'technical-fixture-only-not-user-approval',composition:{width:composition.width,height:composition.height,fps:composition.fps,durationInFrames:composition.durationInFrames},renderScale:.5,repeatedFramesMatch:true,frames:results},null,2));
  console.log(JSON.stringify({output,frameCount:composition.durationInFrames,repeatedFramesMatch:true}));
} finally {await browser.close({silent:true});}
