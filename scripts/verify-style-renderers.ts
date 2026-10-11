import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser,renderStill,selectComposition} from '@remotion/renderer';
import {StoryboardSchema} from '../packages/core/src/schema';
import {PALETTES} from '../packages/core/src/palettes';
import {VISUAL_STYLE_IDS,type VisualStyleId} from '../packages/core/src/visual-styles';

// Internal regression check, not a user-facing component demo or source-video render.
const args=process.argv.slice(2);
if(args.length&&(args.length!==2||args[0]!=='--out')) throw new Error('Usage: npm run verify:styles -- --out OUTPUT_DIR');
const root=resolve(import.meta.dirname,'..');
const out=resolve(args[1]??join(root,'.cache','style-render-qa'));
mkdirSync(out,{recursive:true});
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const decoded=(p:string)=>{
  const r=spawnSync('ffmpeg',['-v','error','-i',p,'-f','rawvideo','-pix_fmt','rgba','-'],{windowsHide:true,maxBuffer:4*1024*1024});
  if(r.status!==0) throw new Error(`PNG decode failed: ${r.stderr}`);
  return r.stdout;
};
const fixture=(id:VisualStyleId)=>{
  const p=PALETTES[id];
  return StoryboardSchema.parse({version:'2.0',presentation:'whole-screen-stage',id:`internal-${id}`,title:'Internal renderer QA',duration:4,fps:30,width:640,height:360,
    captionsMode:'none',source:{video:'unused-synthetic-input.mp4'},theme:{background:p.canvas,foreground:p.foreground,accent:p.accent},
    styleMix:{mode:'seeded-shuffle',seed:29,pool:[id]},beats:[{id:'qa',start:0,end:4,text:'保持内容，只换风格',structure:'thesis-and-proof',
      content:{structure:'thesis-and-proof',thesis:'保持内容，只换风格',reason:'内部渲染校验'},motions:['reveal'],placement:'full',palette:id,directorRole:'hook',
      visualStyle:{id,seed:29017,intensity:.65},stage:{x:.025,y:.05,width:.95,height:.73,depth:'front',surface:'opaque',surfaceOpacity:.9,interaction:'speech',coverSubtitles:false}}]});
};
const serveUrl=await bundle({entryPoint:join(root,'packages/remotion-renderer/src/index.ts'),publicDir:null});
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE??(process.platform==='win32'?['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync):undefined);
const browser=await openBrowser('chrome',{browserExecutable,logLevel:'error'});
const results=[];
try{
  for(const id of VISUAL_STYLE_IDS){
    const storyboard=fixture(id),inputProps={storyboard,overlayOnly:true,cues:[]};
    const composition=await selectComposition({serveUrl,id:'VideoPackaging',inputProps,puppeteerInstance:browser});
    const samples=[];
    for(const [sample,frame] of [91,113,91].entries()){
      const file=`${id}-${frame}${sample===2?'-repeat':''}.png`;
      await renderStill({serveUrl,composition,inputProps,frame,output:join(out,file),puppeteerInstance:browser,logLevel:'error'});
      const pixels=decoded(join(out,file));
      if(pixels.length!==640*360*4) throw new Error(`${id}: wrong decoded dimensions`);
      const colors=new Set<number>();
      for(let i=0;i<pixels.length;i+=4) if(pixels[i+3]>128) colors.add((pixels[i]<<16)|(pixels[i+1]<<8)|pixels[i+2]);
      if(colors.size<24) throw new Error(`${id}: empty or excessively flat frame`);
      samples.push({frame,file,sha256:sha(join(out,file)),pixelSha256:createHash('sha256').update(pixels).digest('hex'),uniqueOpaqueColors:colors.size});
    }
    if(samples[0].pixelSha256!==samples[2].pixelSha256) throw new Error(`${id}: repeated frame differs`);
    if(samples[0].pixelSha256===samples[1].pixelSha256) throw new Error(`${id}: backdrop does not move after semantic content has settled`);
    results.push({id,repeatStable:true,changesAfterContentSettles:true,pngDecodeExit:0,storyboard,samples});
    console.log(`RENDER_OK ${id} repeat=true motion=true decode=0`);
  }
}finally{await browser.close({silent:true});}
writeFileSync(join(out,'verification.json'),JSON.stringify({kind:'internal-regression-not-user-demo',width:640,height:360,frames:[91,113,91],styles:results},null,2));
console.log(`STYLE_RENDER_QA_OK styles=${results.length} frames=${results.length*3}`);
