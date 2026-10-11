/** Synthetic regression stills only; never a real-video Gate C acceptance. */
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {Storyboard} from '../../core/src/schema';
import type {TemplateContent} from '../../core/src/template-contracts';

export const clarityContent: TemplateContent[] = [
  {structure:'command-palette',commandTitle:'把建模任务交给 Computer Use', actions:['请打开软件并新建一个空白建模项目','根据参考图片创建主体结构和基础材质','调整灯光、摄像机位置并检查模型细节','完成后保存工程文件并输出预览结果'], resultState:'每一步都要确认画面结果'},
  {structure:'editorial-dual-rail',kicker:'两种入口',headline:'先确定你要的是哪种建模',leftItems:[{label:'文字描述',detail:'说明对象、尺寸与材质'},{label:'参考图片',detail:'补充轮廓、构图与颜色'}],rightItems:[{label:'给出约束',detail:'保留主体，简化复杂零件'},{label:'检查结果',detail:'看结构，再逐项调整'}],takeaway:'描述越具体，修改越有方向'},
  {structure:'semantic-doodle',subject:'Computer Use',action:'点击窗口并执行建模任务',outcome:'模型结果出现在工作区',accent:'#55d7ff',annotation:'操作流程示意 · 非软件证据'},
  {structure:'four-stage-pipeline',title:'一句需求，拆成可检查的四步',stages:['输入具体要求','创建主体结构','调整材质灯光','保存工程结果'],output:'先完成一版，再做精细修改'},
  {structure:'signal-route',nodes:['输入建模要求','观察软件窗口','执行下一步操作','检查模型结果'],routeLabel:'看见结果，再继续执行',result:'每个节点都有可见结果'},
  {structure:'before-after-scrub',before:'帮我做一个模型',after:'创建白色圆角立方体并添加柔光',criterion:'补上形状、材质和灯光'},
  {structure:'thesis-and-proof',thesis:'提示词说清楚，修改才有方向',reason:'把对象、材质与操作写进一句话，再根据画面逐步调整。',sourceLabel:'教程操作要点'},
  {structure:'bidirectional-flow',leftLabel:'你的建模要求',rightLabel:'软件画面结果',forwardAction:'让助手执行操作',returnAction:'观察结果并补充要求',result:'不是一次生成，而是反复校准'},
  {structure:'metric-odometer',metrics:[{value:'4',unit:'步',label:'当前演示流程',evidenceStatus:'owner-confirmed',sourceLabel:'合成回归示例，非效果指标'}]},
  {structure:'evidence-panel',evidenceAsset:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><rect width="900" height="560" fill="#e6edf7"/><text x="70" y="150" font-size="50">Synthetic layout fixture</text><rect x="190" y="230" width="440" height="210" rx="20" fill="none" stroke="#406080" stroke-width="8"/></svg>'),caption:'合成回归图 · 非软件证据',sourceLabel:'SYNTHETIC FIXTURE',interpretation:'证据图与解释分开，正文不遮住关键画面'},
];

const out = path.resolve(process.argv[2] ?? '../renderer-clarity-v3');
const revision = process.argv[3] ?? 'modified';
await mkdir(path.join(out,revision),{recursive:true});
const serveUrl = await bundle({entryPoint:path.resolve('packages/remotion-renderer/src/index.ts')});
const storyboard: Storyboard = {version:'2.0',id:'synthetic-clarity',title:'Synthetic stage clarity regression',duration:6,fps:30,width:1920,height:1080,captionsMode:'burned-in',source:{video:'unused.mp4'},theme:{background:'#07101f',foreground:'#fff',accent:'#55d7ff'},beats:clarityContent.map((content,index)=>({id:content.structure,start:0,end:6,text:'SYNTHETIC ONLY',structure:content.structure,content,motions:['hit'],placement:'full',palette:'hyperspeed',directorRole:'mechanism',visualStyle:{id:'hyperspeed',seed:351+index,intensity:.75},stage:{x:55/1920,y:90/1080,width:(content.structure==='before-after-scrub'?1100:1250)/1920,height:(content.structure==='before-after-scrub'?300:720)/1080,depth:'front',surface:'opaque',surfaceOpacity:1}}))};
if(revision!=='baseline'){
  const thesis=storyboard.beats.find(beat=>beat.structure==='thesis-and-proof')!;
  storyboard.beats.push({...thesis,id:'compact-thesis-700x260',content:{structure:'thesis-and-proof',thesis:'用一句话开始建模',reason:'先说清对象，再观察结果'},stage:{...thesis.stage!,width:700/1920,height:260/1080}});
  const command=storyboard.beats.find(beat=>beat.structure==='command-palette')!;
  storyboard.beats.push({...command,id:'literal-prompt-1150x300',content:{structure:'command-palette',commandTitle:'输入建模请求',actions:['请创建 Kawasaki Ninja H2R（川崎 Ninja H2R）摩托车模型，并保留绿色车架。'],resultState:'按口播整理 · 非录屏原文'},stage:{...command.stage!,width:1150/1920,height:300/1080}});
  const route=storyboard.beats.find(beat=>beat.structure==='signal-route')!;
  storyboard.beats.push({...route,id:'long-route-five-nodes',content:{structure:'signal-route',nodes:['输入完整建模要求','观察当前软件窗口','执行下一步界面操作','检查生成模型结果','保存最终工程文件'],routeLabel:'逐步完成任务',result:'检查完成再保存'}});
}
await writeFile(path.join(out,revision,'storyboard.json'),JSON.stringify(storyboard,null,2));
for(const beat of storyboard.beats){
  const inputProps={storyboard,beatId:beat.id};
  const composition=await selectComposition({serveUrl,id:'StyleProof',inputProps});
  const output=path.join(out,revision,beat.id+'.png');
  await renderStill({serveUrl,composition,inputProps,frame:130,output,imageFormat:'png'});
  console.log(output);
}
