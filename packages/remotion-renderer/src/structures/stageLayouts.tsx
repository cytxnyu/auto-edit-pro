import type {CSSProperties, ReactElement, ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import type {Palette} from '../../../core/src/palettes';
import type {TemplateContent} from '../../../core/src/template-contracts';
import {useStageSurface} from '../stage/context';
import {styleMaterial} from '../styles';
import {phase, rise, typography} from './shared';
import type {StructureProps} from './types';

type Content<K extends TemplateContent['structure']> = Extract<TemplateContent,{structure:K}>;
type LayoutProps<K extends TemplateContent['structure']> = Omit<StructureProps,'content'> & {content:Content<K>};

/** Stage dimensions are physical pixels. Text never inherits a 1920px design-canvas shrink. */
const titleStyle: CSSProperties = {margin:0,fontSize:'clamp(44px,4.5cqw,60px)',lineHeight:1.16,fontWeight:950,letterSpacing:'-.025em',overflowWrap:'anywhere'};
const bodyStyle: CSSProperties = {fontSize:40,lineHeight:1.28,fontWeight:780,overflowWrap:'anywhere',textWrap:'balance',minWidth:0};
const localPlate = (palette:Palette):CSSProperties => ({background:`${palette.surface}ed`,border:`1px solid ${palette.line}70`,borderRadius:12});
const stableReveal = (progress:number,index=0):CSSProperties => rise(phase(progress,.04+index*.08,.30+index*.08),12);

const StageCanvas = ({id,palette,children}: {id:TemplateContent['structure'];palette:Palette;children:ReactNode}):ReactElement => {
  const stage=useStageSurface();
  const material=stage?.visualStyle ? styleMaterial(stage.visualStyle):undefined;
  return <AbsoluteFill data-structure-identity={id} data-critical-content="true" data-stage-layout={id} data-density-mode="physical-content-fit" style={{...typography,color:palette.foreground,containerType:'size',overflow:'hidden',fontFamily:material?.fontFamily ?? typography.fontFamily}}>
    <style>{`@container (max-height: 340px) {
      [data-stage-layout="thesis-and-proof"] .stage-thesis-content {inset:14px 18px!important;gap:10px!important}
      [data-stage-layout="thesis-and-proof"] .stage-thesis-kicker {display:none!important}
      [data-stage-layout="thesis-and-proof"] .stage-thesis-columns {gap:16px!important;grid-template-columns:1fr 1.15fr!important}
      [data-stage-layout="thesis-and-proof"] h2 {font-size:40px!important;padding:15px!important;line-height:1.2!important}
      [data-stage-layout="thesis-and-proof"] aside {padding:15px!important}
      [data-stage-layout="thesis-and-proof"] [data-stage-body] {font-size:38px!important;line-height:1.22!important}
      [data-stage-layout="thesis-and-proof"] .stage-thesis-source {margin-top:10px!important;font-size:22px!important}
      [data-stage-layout="command-palette"] .stage-command-content {inset:12px 18px!important;gap:10px!important}
      [data-stage-layout="command-palette"] h2 {font-size:38px!important}
      [data-stage-layout="command-palette"] [data-command-row] {padding:10px 16px!important}
      [data-stage-layout="command-palette"] [data-stage-body] {font-size:38px!important;line-height:1.18!important}
      [data-stage-layout="command-palette"] [data-stage-result] {font-size:30px!important;padding:9px 16px!important}
      [data-stage-layout="signal-route"] .stage-route-content {inset:12px 18px!important;gap:13px!important}
      [data-stage-layout="signal-route"] h2 {font-size:38px!important;padding:8px 14px!important}
      [data-stage-layout="signal-route"] [data-route-layout] {gap:12px!important}
      [data-stage-layout="signal-route"] .stage-route-circle {width:44px!important;height:44px!important;margin-bottom:10px!important;font-size:25px!important}
      [data-stage-layout="signal-route"] .stage-route-line {top:22px!important}
      [data-stage-layout="signal-route"] .stage-route-label {padding:10px!important}
      [data-stage-layout="signal-route"] [data-stage-body] {font-size:38px!important;line-height:1.15!important}
      [data-stage-layout="signal-route"] [data-stage-result] {font-size:30px!important;padding:8px 15px!important}
    }`}</style>
    {/* No second full-card veil: the actual StyleBackdrop remains visible between semantic elements. */}
    <div aria-hidden data-stage-contrast-wash="local-only" style={{position:'absolute',inset:0,pointerEvents:'none',background:`linear-gradient(90deg,${palette.canvas}24,transparent 80%)`}}/>
    {children}
  </AbsoluteFill>;
};
const Eyebrow=({children,palette}: {children:ReactNode;palette:Palette}):ReactElement => <div style={{display:'inline-flex',alignItems:'center',gap:12,fontSize:22,fontWeight:850,letterSpacing:'.035em',lineHeight:1.2,color:palette.line,padding:'7px 11px',background:`${palette.canvas}de`,borderRadius:5}}><span aria-hidden style={{width:26,height:3,background:palette.accent}}/>{children}</div>;
const Result=({children,palette,progress=1}: {children:ReactNode;palette:Palette;progress?:number}):ReactElement => <div data-stage-result style={{...bodyStyle,...stableReveal(phase(progress,.25,.82)),display:'flex',alignItems:'center',gap:16,alignSelf:'flex-start',width:'fit-content',maxWidth:'100%',padding:'13px 20px',background:palette.accent,color:palette.canvas,borderRadius:8,boxSizing:'border-box'}}><span aria-hidden>✓</span><span style={{minWidth:0}}>{children}</span></div>;

export const StageCommandPalette=({content,progress,palette}:LayoutProps<'command-palette'>):ReactElement => {
  const stage=useStageSurface();
  const material=stage?.visualStyle ? styleMaterial(stage.visualStyle):undefined;
  const focus=Math.min(content.actions.length-1,Math.floor(phase(progress,.10,.72)*content.actions.length));
  return <StageCanvas id={content.structure} palette={palette}><div className="stage-command-content" style={{position:'absolute',inset:'28px 30px',display:'flex',flexDirection:'column',justifyContent:'center',gap:20}}>
    <div style={{...stableReveal(progress),alignSelf:'flex-start',maxWidth:'100%',padding:'12px 18px',background:`${palette.canvas}e8`,borderLeft:`6px solid ${palette.accent}`}}><h2 style={titleStyle}>{content.commandTitle}</h2></div>
    <div style={{display:'grid',gap:12}}>{content.actions.map((action,index)=>{const active=index===focus;return <div key={index} data-command-row={index+1} style={{...localPlate(palette),...stableReveal(progress,index),display:'grid',gridTemplateColumns:'48px minmax(0,1fr)',alignItems:'center',gap:18,padding:'16px 22px',borderRadius:material?.radius ?? 12,borderColor:active?palette.accent:`${palette.line}70`,borderWidth:active?2:1,boxSizing:'border-box'}}><span style={{fontSize:30,fontWeight:950,color:active?palette.accent:palette.line}}>{String(index+1).padStart(2,'0')}</span><div data-stage-body style={{...bodyStyle,fontWeight:active?900:750}}>{action}</div></div>;})}</div>
    <Result palette={palette} progress={progress}>{content.resultState}</Result>
  </div></StageCanvas>;
};

export const StageEditorialDualRail=({content,progress,palette}:LayoutProps<'editorial-dual-rail'>):ReactElement => <StageCanvas id={content.structure} palette={palette}>
  <div style={{position:'absolute',inset:'26px 28px',display:'flex',flexDirection:'column',justifyContent:'center',gap:22}}>
    <header style={{...stableReveal(progress),alignSelf:'flex-start',maxWidth:'100%',padding:'13px 18px',background:`${palette.canvas}ed`,borderLeft:`6px solid ${palette.accent}`}}><Eyebrow palette={palette}>{content.kicker}</Eyebrow><h2 style={{...titleStyle,marginTop:10}}>{content.headline}</h2></header>
    <div data-rail-layout="two-content-columns" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:24,alignItems:'start'}}>{[content.leftItems,content.rightItems].map((items,rail)=><section key={rail} style={{display:'grid',gap:14}}>{items.map((item,index)=><article key={index} style={{...localPlate(palette),...stableReveal(progress,index+rail),padding:'17px 20px',borderLeft:`5px solid ${rail?palette.accent:palette.line}`}}><div style={{display:'flex',gap:15,alignItems:'baseline'}}><span style={{fontSize:24,fontWeight:900,color:palette.line}}>{String(index+1).padStart(2,'0')}</span><div style={{...bodyStyle,fontWeight:920}}>{item.label}</div></div><div data-stage-body style={{fontSize:36,lineHeight:1.3,fontWeight:690,color:palette.foreground,marginTop:9,overflowWrap:'anywhere'}}>{item.detail}</div></article>)}</section>)}</div>
    <Result palette={palette} progress={progress}>{content.takeaway}</Result>
  </div>
</StageCanvas>;

export const StageThesisAndProof=({content,progress,palette}:LayoutProps<'thesis-and-proof'>):ReactElement => <StageCanvas id={content.structure} palette={palette}>
  <div className="stage-thesis-content" style={{position:'absolute',inset:'38px 34px',display:'flex',flexDirection:'column',justifyContent:'center',gap:30}}>
    <div className="stage-thesis-kicker" style={{alignSelf:'flex-start'}}><Eyebrow palette={palette}>核心判断 → 为什么</Eyebrow></div>
    <div className="stage-thesis-columns" style={{display:'grid',gridTemplateColumns:'1.08fr 1fr',gap:28,alignItems:'center'}}>
      <h2 style={{...titleStyle,...stableReveal(progress),fontSize:'clamp(48px,5.8cqw,76px)',lineHeight:1.22,padding:'24px 26px',background:`${palette.canvas}e8`,borderLeft:`8px solid ${palette.accent}`}}>{content.thesis}</h2>
      <aside style={{...localPlate(palette),...stableReveal(progress,2),padding:'24px 26px'}}><p data-stage-body style={{...bodyStyle,margin:0}}>{content.reason}</p>{content.sourceLabel?<div className="stage-thesis-source" style={{marginTop:24,fontSize:26,fontWeight:750,color:palette.line}}>{content.sourceLabel}</div>:null}{content.sourceDetail?<p style={{fontSize:26,lineHeight:1.35,margin:'14px 0 0',color:palette.muted}}>{content.sourceDetail}</p>:null}</aside>
    </div>
    <div style={{height:5,width:`${phase(progress,.06,.65)*100}%`,background:palette.accent}}/>
  </div>
</StageCanvas>;

export const StageBidirectionalFlow=({content,progress,palette}:LayoutProps<'bidirectional-flow'>):ReactElement => {
  const forward=phase(progress,.08,.44);const back=phase(progress,.35,.78);
  return <StageCanvas id={content.structure} palette={palette}><div style={{position:'absolute',inset:'32px 36px',display:'flex',flexDirection:'column',justifyContent:'center',gap:24}}>
    <div style={{display:'flex',alignItems:'center',gap:18,...stableReveal(progress)}}><div style={{...bodyStyle,...localPlate(palette),padding:'13px 20px',fontSize:38}}>{content.forwardAction}</div><div data-flow-forward style={{height:6,flex:1,transform:`scaleX(${forward})`,transformOrigin:'left',background:palette.accent}}/><span style={{fontSize:50,color:palette.accent}}>→</span></div>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:'12%'}}>{[content.leftLabel,content.rightLabel].map((label,index)=><section key={index} style={{...localPlate(palette),...stableReveal(progress,index),padding:'28px 26px',borderTop:`6px solid ${index?palette.accent:palette.line}`}}><Eyebrow palette={palette}>{index?'软件结果':'输入要求'}</Eyebrow><h2 style={{...titleStyle,marginTop:22,lineHeight:1.25}}>{label}</h2></section>)}</div>
    <div style={{display:'flex',alignItems:'center',gap:18,...stableReveal(progress,3)}}><span style={{fontSize:50,color:palette.line}}>←</span><div data-flow-return style={{height:4,flex:1,transform:`scaleX(${back})`,transformOrigin:'right',background:palette.line}}/><div style={{...bodyStyle,...localPlate(palette),padding:'13px 20px',fontSize:36}}>{content.returnAction??'观察并反馈'}</div></div>
    <Result palette={palette} progress={progress}>{content.result}</Result>
  </div></StageCanvas>;
};

export const StageFourStagePipeline=({content,progress,palette}:LayoutProps<'four-stage-pipeline'>):ReactElement => <StageCanvas id={content.structure} palette={palette}><div style={{position:'absolute',inset:'32px 32px',display:'flex',flexDirection:'column',justifyContent:'center',gap:34}}>
  <header style={{alignSelf:'flex-start',...stableReveal(progress),padding:'14px 20px',background:`${palette.canvas}ed`}}><Eyebrow palette={palette}>按顺序完成</Eyebrow><h2 style={{...titleStyle,marginTop:14}}>{content.title}</h2></header>
  <div data-pipeline-layout="numbered-wide-steps" style={{display:'grid',gridTemplateColumns:`repeat(${content.stages.length},minmax(0,1fr))`,gap:24}}>{content.stages.map((label,index)=>{const active=phase(progress,.05+index*.10,.33+index*.1);return <article key={index} style={{...localPlate(palette),...stableReveal(progress,index),position:'relative',padding:'24px 20px',borderTop:`6px solid ${active>.5?palette.accent:palette.line}`,minWidth:0}}><div style={{fontSize:62,fontWeight:950,lineHeight:1,color:palette.accent}}>{String(index+1).padStart(2,'0')}</div><div data-stage-body style={{...bodyStyle,marginTop:24,lineHeight:1.35}}>{label}</div>{index<content.stages.length-1?<span aria-hidden style={{position:'absolute',right:-26,top:28,color:palette.accent,fontSize:38,fontWeight:950}}>→</span>:null}</article>;})}</div>
  <Result palette={palette} progress={progress}>{content.output??'完成结果'}</Result>
</div></StageCanvas>;

/** Shallow prompt bands keep both states visible; only the connector advances. */
export const StageBeforeAfterScrub=({content,progress,palette}:LayoutProps<'before-after-scrub'>):ReactElement => <StageCanvas id={content.structure} palette={palette}>
  <div data-before-after-layout="two-anchored-states" style={{position:'absolute',inset:'16px 22px',display:'flex',flexDirection:'column',justifyContent:'center',gap:'clamp(10px,3cqh,22px)'}}>
    <div style={{alignSelf:'flex-start',padding:'5px 12px',fontSize:26,fontWeight:800,lineHeight:1.2,background:`${palette.canvas}ed`,color:palette.line}}>{content.criterion}</div>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 46px minmax(0,1.45fr)',gap:16,alignItems:'center'}}>
      <article style={{...localPlate(palette),...stableReveal(progress),padding:'15px 20px',borderLeft:`5px solid ${palette.line}`}}><div style={{fontSize:22,fontWeight:850,color:palette.line,marginBottom:10}}>修改前</div><div data-stage-body style={{...bodyStyle,fontSize:'clamp(36px,3.7cqw,44px)'}}>{content.before}</div></article>
      <span aria-hidden style={{fontSize:44,color:palette.accent,opacity:.2+.8*phase(progress,.15,.55)}}>→</span>
      <article style={{...localPlate(palette),...stableReveal(progress,1),padding:'15px 20px',borderLeft:`5px solid ${palette.accent}`}}><div style={{fontSize:22,fontWeight:850,color:palette.accent,marginBottom:10}}>修改后</div><div data-stage-body style={{...bodyStyle,fontSize:'clamp(36px,3.7cqw,44px)',fontWeight:900}}>{content.after}</div></article>
    </div>
    {content.delta?<div style={{alignSelf:'flex-end',fontSize:26,fontWeight:850,padding:'7px 14px',color:palette.canvas,background:palette.accent}}>{content.delta}</div>:null}
  </div>
</StageCanvas>;

export const StageEvidencePanel=({content,progress,palette,evidence}:LayoutProps<'evidence-panel'>):ReactElement => <StageCanvas id={content.structure} palette={palette}><div style={{position:'absolute',inset:'28px 30px',display:'grid',gridTemplateRows:'minmax(0,1fr) auto',gap:20}}>
  <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.5fr) minmax(0,1fr)',gap:24,minHeight:0}}><div style={{position:'relative',background:'#fff',border:`3px solid ${palette.line}`,borderRadius:10,overflow:'hidden',...stableReveal(progress)}}><img src={evidence?.src??content.evidenceAsset} alt={content.caption} style={{width:'100%',height:'100%',objectFit:'contain'}}/></div><aside style={{alignSelf:'center',...localPlate(palette),...stableReveal(progress,2),padding:'22px 24px'}}><Eyebrow palette={palette}>画面说明</Eyebrow><p data-stage-body style={{...bodyStyle,margin:'22px 0 0'}}>{content.interpretation}</p></aside></div>
  <div style={{display:'flex',flexWrap:'wrap',gap:16,alignItems:'center',padding:'13px 18px',...localPlate(palette)}}><span style={{fontSize:26,color:palette.line,fontWeight:850}}>{evidence?.label??content.sourceLabel}</span><span style={{fontSize:30,color:palette.foreground,fontWeight:760}}>{content.caption}</span></div>
</div></StageCanvas>;

const MetricValue=({value,progress}:{value:string;progress:number}):ReactElement=>{
  const numeric=value.replace(/[^0-9.-]/g,'');
  const verbal=!/[0-9]/.test(value)||numeric==='';
  return <span data-verbal-metric={String(verbal)}>{verbal?value:Number.isFinite(Number(numeric))?String(Math.round(Number(numeric)*phase(progress,.08,.64))):value}</span>;
};
export const StageMetricOdometer=({content,progress,palette}:LayoutProps<'metric-odometer'>):ReactElement => <StageCanvas id={content.structure} palette={palette}><div style={{position:'absolute',inset:'38px 34px',display:'grid',gridTemplateColumns:content.metrics.length===1?'minmax(0,680px)':`repeat(${content.metrics.length},minmax(0,1fr))`,gap:26,alignContent:'center'}}>{content.metrics.map((metric,index)=><article key={index} style={{...localPlate(palette),...stableReveal(progress,index),padding:'28px 26px',borderTop:`6px solid ${palette.accent}`}}><Eyebrow palette={palette}>{metric.evidenceStatus==='sourced'?'来源数据':metric.evidenceStatus==='estimate'?'估计值':'当前案例'}</Eyebrow><div style={{marginTop:24,fontSize:'clamp(88px,10cqw,144px)',fontWeight:950,lineHeight:1.05,letterSpacing:'-.035em',color:palette.accent}}><MetricValue value={metric.value} progress={progress}/><span style={{fontSize:40,marginLeft:12,color:palette.foreground}}>{metric.unit}</span></div><div data-stage-body style={{...bodyStyle,marginTop:25}}>{metric.label}</div>{metric.sourceLabel?<div style={{fontSize:26,lineHeight:1.35,marginTop:24,color:palette.line,overflowWrap:'anywhere'}}>{metric.sourceLabel}</div>:null}</article>)}</div></StageCanvas>;

/** Labels share each node's CSS grid track, with normal wrapping rather than SVG clipping. */
export const StageSignalRoute=({content,progress,palette}:LayoutProps<'signal-route'>):ReactElement => {
  const route=phase(progress,.05,.75);const focus=Math.min(content.nodes.length-1,Math.floor(route*content.nodes.length));
  return <StageCanvas id={content.structure} palette={palette}><div className="stage-route-content" style={{position:'absolute',inset:'32px 30px',display:'flex',flexDirection:'column',justifyContent:'center',gap:44}}>
    <h2 style={{...titleStyle,...stableReveal(progress),padding:'14px 20px',alignSelf:'flex-start',background:`${palette.canvas}ed`}}>{content.routeLabel}</h2>
    <div data-route-layout="anchored-grid" style={{position:'relative',display:'grid',gridTemplateColumns:`repeat(${content.nodes.length},minmax(0,1fr))`,gap:20}}>
      <div aria-hidden className="stage-route-line" style={{position:'absolute',left:`${50/content.nodes.length}%`,right:`${50/content.nodes.length}%`,height:5,top:37,background:`${palette.line}55`}}><div data-route-progress style={{height:5,width:`${route*100}%`,background:palette.accent}}/></div>
      {content.nodes.map((node,index)=><div key={index} data-route-label-anchor={`node-${index+1}`} style={{position:'relative',minWidth:0,...stableReveal(progress,index)}}><div className="stage-route-circle" style={{width:72,height:72,boxSizing:'border-box',display:'grid',placeItems:'center',margin:'0 auto 24px',border:`4px solid ${index<=focus?palette.accent:palette.line}`,background:palette.canvas,borderRadius:'50%',color:palette.foreground,fontSize:30,fontWeight:950}}>{index+1}</div><div className="stage-route-label" style={{...localPlate(palette),padding:'16px 14px',textAlign:'center',borderColor:index===focus?palette.accent:`${palette.line}70`}}><div data-stage-body style={{...bodyStyle,fontSize:40,lineHeight:1.3}}>{node}</div>{content.failureNode===node?<div style={{fontSize:24,fontWeight:800,color:palette.accent,marginTop:12}}>检查此步</div>:null}</div></div>)}
    </div>
    <Result palette={palette} progress={progress}>{content.result}</Result>
  </div></StageCanvas>;
};

/** A literal schematic, not a screenshot or fixed rock-pushing metaphor. */
export const StageSemanticDoodle=({content,progress,palette,Illustration}:LayoutProps<'semantic-doodle'>):ReactElement => {
  const action=phase(progress,.12,.55);const result=phase(progress,.38,.78);
  return <StageCanvas id={content.structure} palette={palette}><div style={{position:'absolute',inset:'30px 34px',display:'flex',flexDirection:'column',justifyContent:'center',gap:22}}>
    <header style={{...stableReveal(progress),alignSelf:'flex-start',padding:'13px 19px',background:`${palette.canvas}ed`}}><Eyebrow palette={palette}>{content.annotation??'操作流程示意 · 非软件证据'}</Eyebrow><h2 style={{...titleStyle,marginTop:13}}>{content.subject}</h2></header>
    <div data-integrated-doodle="subject-action-outcome" style={{display:'grid',gridTemplateColumns:'minmax(0,1.3fr) minmax(0,1fr)',gap:26,alignItems:'center'}}>
      <div style={{position:'relative',height:'clamp(220px,35cqh,300px)',...localPlate(palette),padding:16,boxSizing:'border-box'}}>{Illustration?<Illustration progress={progress} accent={content.accent} subject={content.subject} action={content.action} outcome={content.outcome}/>:<svg data-doodle-semantic="window-pointer-result" viewBox="0 0 620 300" width="100%" height="100%" fill="none" style={{overflow:'visible'}} aria-label={`${content.subject}：${content.action}，${content.outcome}`}>
        <rect x="20" y="24" width="330" height="245" rx="14" fill="none" stroke={palette.line} strokeWidth="5"/>
        <path d="M20 74 H350 M48 49 H59 M78 49 H89 M108 49 H119" fill="none" stroke={palette.line} strokeWidth="5" strokeLinecap="round"/>
        <path d="M55 108 H178 M55 140 H155 M55 172 H135" fill="none" stroke={palette.muted} strokeWidth="5" strokeLinecap="round"/>
        <path d="M200 142 L200 216 L222 197 L237 233 L254 226 L239 192 L268 192 Z" fill="none" stroke={content.accent} strokeWidth="6" transform={`translate(${(1-action)*42} ${(1-action)*20})`}/>
        <circle cx="210" cy="146" r={12+action*18} fill="none" stroke={content.accent} strokeWidth="3" opacity={.2+action*.65}/>
        <path d="M370 150 H425 M406 133 L425 150 L406 167" fill="none" stroke={content.accent} strokeWidth="6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-action}/>
        <g opacity={.15+.85*result}><rect x="452" y="69" width="140" height="164" rx="14" fill="none" stroke={palette.line} strokeWidth="5"/><path d="M480 148 L507 176 L563 117" fill="none" stroke={content.accent} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></g>
      </svg>}</div>
      <div style={{display:'flex',flexDirection:'column',gap:22}}><div style={{...localPlate(palette),...stableReveal(progress,1),padding:'20px 22px',borderLeft:`6px solid ${palette.line}`}}><div style={{fontSize:23,fontWeight:850,color:palette.line,marginBottom:12}}>执行动作</div><div data-stage-body style={bodyStyle}>{content.action}</div></div><Result palette={palette} progress={progress}>{content.outcome}</Result></div>
    </div>
  </div></StageCanvas>;
};
