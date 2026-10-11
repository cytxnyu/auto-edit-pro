import type {ReactElement, ReactNode} from 'react';
import {PALETTES} from '../../../core/src/palettes';
import type {StyleBackdropProps} from './index';

/** Twenty independent, original SVG adaptations. Reference mechanisms are recorded
 * in references/catalog-backgrounds.json. No upstream runtime or assets are used. */
type Props = StyleBackdropProps;
type Point = [number, number];
const TAU = Math.PI * 2;
const clamp = (x: number): number => Math.max(0, Math.min(1, x));
const mod = (x: number, n = 1): number => ((x % n) + n) % n;
const fixed = (x: number): string => x.toFixed(2);
const seed = (s: number, i: number): number => {
  let n = Math.imul((s ^ (i + 16381)) >>> 0, 0x45d9f3b);
  n = Math.imul(n ^ n >>> 16, 0x45d9f3b);
  return ((n ^ n >>> 16) >>> 0) / 4294967296;
};
const colors = (p: Props): [string,string,string] => p.style.colors ?? [PALETTES[p.style.id].accent, PALETTES[p.style.id].line, PALETTES[p.style.id].canvas];
const time = (p: Props, speed = 1): number => p.frame / p.fps * speed * (.3 + .7 * clamp(p.style.intensity));
const phase = (p: Props, i = 1): number => seed(p.style.seed, i) * TAU;
const id = (p: Props, suffix = 'g'): string => `cb-${p.style.id}-${p.style.seed}-${Math.round(p.width)}-${Math.round(p.height)}-${suffix}`;
const path = (points: Point[], closed = false): string => points.map(([x,y], i) => `${i ? 'L' : 'M'}${fixed(x)},${fixed(y)}`).join('') + (closed ? 'Z' : '');
const sample = (count: number, fn: (v: number, i: number) => Point): Point[] => Array.from({length: count}, (_, i) => fn(i / (count - 1), i));
const surface = (p: Props, mechanism: string, children: ReactNode): ReactElement => <svg data-effect={mechanism} data-abstract-surface="true" width={p.width} height={p.height} viewBox={`0 0 ${p.width} ${p.height}`} style={{display:'block',overflow:'hidden'}}>
  <rect width={p.width} height={p.height} fill={colors(p)[2]}/>{children}
</svg>;
const gradient = (p: Props, suffix = 'g', angle = 0): ReactElement => {
  const c = colors(p);
  return <linearGradient id={id(p,suffix)} x1="0" y1="0" x2="1" y2="1" gradientTransform={`rotate(${fixed(angle)} .5 .5)`}><stop stopColor={c[0]}/><stop offset=".5" stopColor={c[1]}/><stop offset="1" stopColor={c[2]}/></linearGradient>;
};
const blur = (p: Props, amount: number, suffix = 'blur'): ReactElement => <filter id={id(p,suffix)} x="-40%" y="-60%" width="180%" height="220%"><feGaussianBlur stdDeviation={amount}/></filter>;

const Aurora = (p: Props): ReactElement => {
  const c=colors(p), t=time(p,.36), q=phase(p), w=p.width,h=p.height;
  const crest=(x:number)=>h*(.29+.11*Math.sin(x*6+t+q)+.045*Math.sin(x*17-t*.7));
  const curtains=Array.from({length:4},(_,k)=>{
    const points=sample(100,x=>[x*w,crest(x)+k*h*.044]);
    return <path key={k} d={path([...points,[w,-h*.1],[0,-h*.1]],true)} fill={k%2?c[1]:c[0]} opacity={.1+k*.045}/>;
  });
  return surface(p,'aurora-light-curtain',<><defs>{gradient(p)}{blur(p,h*.024)}</defs><g filter={`url(#${id(p,'blur')})`}>{curtains}</g>
    {Array.from({length:70},(_,i)=>{const x=i/69, top=crest(x), length=h*(.16+.16*seed(p.style.seed,i));return <path key={i} d={`M${fixed(x*w)},${fixed(top)}Q${fixed(x*w+Math.sin(t+x*8)*w*.016)},${fixed(top-length*.45)} ${fixed(x*w+w*.008)},${fixed(top-length)}`} fill="none" stroke={i%3?c[0]:c[1]} strokeWidth={w*.007} opacity={.07+.09*Math.sin(x*9+t)**2}/>;})}
    <path d={path(sample(100,x=>[x*w,crest(x)]))} fill="none" stroke={`url(#${id(p)})`} strokeWidth={h*.014} opacity=".65"/>
  </>);
};

const SoftAurora = (p: Props): ReactElement => {
  const c=colors(p), t=time(p,.2),q=phase(p),w=p.width,h=p.height;
  return surface(p,'soft-aurora-diffuse-layer-bands',<><defs>{blur(p,h*.07)}</defs><g filter={`url(#${id(p,'blur')})`}>
    {Array.from({length:6},(_,k)=>{const points=sample(80,x=>[x*w,h*(.18+k*.115+.12*Math.sin(x*3.5+t*(.5+k*.07)+q+k*.65))]);return <path key={k} d={path(points)} fill="none" stroke={k%2?c[1]:c[0]} strokeWidth={h*(.12+.03*Math.sin(t+k)**2)} opacity={.14+k*.025}/>;})}
  </g></>);
};

const Silk = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.3),q=phase(p),w=p.width,h=p.height;
  const fold=(x:number,y:number)=>x*w+Math.sin(y*5+t+q+x*3)*w*.055+Math.sin(y*11-t*.6+x*7)*w*.018;
  return surface(p,'silk-satin-fold-ribbons',<><defs>{Array.from({length:12},(_,k)=><linearGradient key={k} id={id(p,`fold${k}`)}><stop stopColor={c[2]}/><stop offset={.48+.18*Math.sin(t+k)} stopColor={k%3?c[0]:c[1]} stopOpacity=".7"/><stop offset="1" stopColor={c[2]}/></linearGradient>)}</defs>
    {Array.from({length:12},(_,k)=>{const a=(k-1)/10;const left=sample(65,y=>[fold(a,y),y*h]);const right=sample(65,y=>[fold(a+.12,y),y*h]).reverse();return <path key={k} d={path([...left,...right],true)} fill={`url(#${id(p,`fold${k}`)})`}/>;})}
  </>);
};

const Iridescence = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.24),q=phase(p),w=p.width,h=p.height,s=Math.min(w,h);
  return surface(p,'iridescent-interference-lobes',<><defs>{gradient(p,'spectrum',Math.sin(t)*30)}</defs>
    {Array.from({length:35},(_,k)=>{const points=sample(100,v=>{const a=v*TAU;const r=s*(.08+k*.031)*(1+.12*Math.sin(a*3+t+q)+.06*Math.sin(a*7-t*.4+k*.09));return [w*.5+Math.cos(a)*r*(1.1+.2*Math.cos(t+q)),h*.5+Math.sin(a)*r];});return <path key={k} d={path(points,true)} fill={k===34?`url(#${id(p,'spectrum')})`:'none'} fillOpacity=".09" stroke={k%3===0?c[1]:`url(#${id(p,'spectrum')})`} strokeWidth={k%3===0?s*.008:s*.017} opacity={.18+(k%4)*.1}/>;})}
  </>);
};

const Orb = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.45),q=phase(p),w=p.width,h=p.height,r=Math.min(w,h)*.32;
  return surface(p,'hollow-orb-energy-contours',<><defs>{blur(p,r*.07)}</defs>
    <ellipse cx={w*.5} cy={h*.5} rx={r*(1+.03*Math.sin(t+q))} ry={r} fill="none" stroke={c[0]} strokeWidth={r*.16} opacity=".17" filter={`url(#${id(p,'blur')})`}/>
    {Array.from({length:21},(_,k)=>{const points=sample(115,v=>{const a=v*TAU;const radius=r*(1+.075*Math.sin(a*4+t+q+k*.19)+.026*Math.cos(a*9-t*1.4+k));return [w*.5+Math.cos(a)*radius*(1+k*.003),h*.5+Math.sin(a)*radius];});return <path key={k} d={path(points,true)} fill="none" stroke={k%3?c[0]:c[1]} strokeWidth={k%5===0?2:1} opacity={.16+k*.014}/>;})}
  </>);
};

const Galaxy = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.12),q=phase(p),w=p.width,h=p.height;
  return surface(p,'galaxy-depth-starfield',Array.from({length:170},(_,i)=>{
    const angle=seed(p.style.seed,i*3)*TAU+t*.07;
    const depth=mod(seed(p.style.seed,i*3+1)+t*.022),radius=Math.sqrt(depth)*Math.hypot(w,h)*.63;
    const x=w*.5+Math.cos(angle+q)*radius,y=h*.5+Math.sin(angle+q)*radius;
    const size=.5+depth*seed(p.style.seed,i*3+2)*2.2;
    return <g key={i} transform={`translate(${fixed(x)} ${fixed(y)})`} fill={i%4?c[0]:c[1]} opacity={.18+depth*.65}>
      <circle r={size}/>{i%13===0?<path d={`M-${fixed(size*5)},0H${fixed(size*5)}M0,-${fixed(size*5)}V${fixed(size*5)}`} stroke={c[1]} strokeWidth=".6"/>:null}
    </g>;
  }));
};

const Particles = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.27),q=phase(p),w=p.width,h=p.height;
  return surface(p,'projected-parallax-particle-cloud',Array.from({length:100},(_,i)=>{
    const x0=(seed(p.style.seed,i*4)-.5)*2,y0=(seed(p.style.seed,i*4+1)-.5)*2,z=seed(p.style.seed,i*4+2);
    const a=t*.1+q*.1, x=x0*Math.cos(a)+Math.sin(a)*(z-.5);
    const perspective=1/(1.4-z*.55);
    const cx=w*(.5+x*.62*perspective),cy=h*(.5+y0*.7*perspective+Math.sin(t+i)*.015);
    return <circle key={i} cx={cx} cy={cy} r={(2+z*5)*(.9+.1*Math.sin(t+i))} fill={i%3?c[0]:c[1]} fillOpacity={.12+z*.22} stroke={i%3?c[1]:c[0]} strokeOpacity={.12+z*.3} strokeWidth=".6"/>;
  }));
};

const Beams = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.26),q=phase(p),w=p.width,h=p.height;
  return surface(p,'sculpted-parallel-light-planes',<><defs><linearGradient id={id(p)}><stop stopColor={c[2]}/><stop offset=".43" stopColor={c[1]} stopOpacity=".18"/><stop offset=".72" stopColor={c[0]} stopOpacity=".6"/><stop offset="1" stopColor={c[2]}/></linearGradient></defs>
    {Array.from({length:13},(_,k)=>{const left=sample(65,v=>[w*(k/12+.014*Math.sin(v*8+t+k*.38+q)),v*h]);const right=sample(65,v=>[w*((k+1)/12+.014*Math.sin(v*8+t+k*.38+q)+.008*Math.sin(v*17-t)),v*h]).reverse();return <path key={k} d={path([...left,...right],true)} fill={`url(#${id(p)})`} stroke={k%3===0?c[1]:'none'} strokeOpacity=".15" strokeWidth=".8"/>;})}
  </>);
};

const LightRays = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.21),q=phase(p),w=p.width,h=p.height,origin=w*(.35+seed(p.style.seed,8)*.3);
  return surface(p,'single-source-diverging-light-fan',<><defs><linearGradient id={id(p)} x1="0" y1="0" x2="0" y2="1"><stop stopColor={c[0]} stopOpacity=".7"/><stop offset="1" stopColor={c[1]} stopOpacity="0"/></linearGradient>{blur(p,2)}</defs>
    <g filter={`url(#${id(p,'blur')})`}>{Array.from({length:16},(_,i)=>{const end=w*((i-3)/10+.1*Math.sin(t+i*.3+q));const spread=w*(.02+.025*seed(p.style.seed,i));return <path key={i} d={`M${fixed(origin)},${fixed(-h*.1)}L${fixed(end-spread)},${fixed(h*1.15)}L${fixed(end+spread)},${fixed(h*1.15)}Z`} fill={`url(#${id(p)})`} opacity={.07+.09*seed(p.style.seed,i+22)}/>;})}</g>
  </>);
};

const PixelSnow = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.55),w=p.width,h=p.height,unit=Math.max(2,Math.min(w,h)/160);
  return surface(p,'depth-layered-pixel-snowfall',Array.from({length:180},(_,i)=>{
    const depth=.25+seed(p.style.seed,i*3)*.75;
    const x=Math.floor(mod(seed(p.style.seed,i*3+1)*w+t*w*.04*depth,w)/unit)*unit;
    const y=Math.floor(mod(seed(p.style.seed,i*3+2)*h+t*h*.09*depth,h)/unit)*unit;
    const size=unit*(depth>.7?2:1);
    return <g key={i} transform={`translate(${x} ${y})`} fill={i%6?c[0]:c[1]} opacity={.15+depth*.55}><rect width={size} height={size}/>{i%11===0?<><rect x={-size} y={size/3} width={size*3} height={size/3}/><rect x={size/3} y={-size} width={size/3} height={size*3}/></>:null}</g>;
  }));
};

const Dither = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.29),q=phase(p),w=p.width,h=p.height,cell=Math.max(3,w/170);
  const matrix=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],paths=['',''];
  for(let row=0;row<Math.ceil(h/cell);row++)for(let col=0;col<Math.ceil(w/cell);col++){
    const u=col*cell/w,v=row*cell/h;
    const field=.5+.24*Math.sin(u*9+Math.sin(v*6+t)+q)+.2*Math.sin(v*12-t*.8+u*3);
    if(field>(matrix[(row%4)*4+col%4]+.5)/16){const tone=field>.7?1:0;const size=cell*.68;paths[tone]+=`M${fixed(col*cell)},${fixed(row*cell)}h${fixed(size)}v${fixed(size)}h-${fixed(size)}Z`;}
  }
  return surface(p,'ordered-dither-wave-ink',<>{paths.map((d,i)=><path key={i} d={d} fill={c[i]} opacity={i?.5:.25}/>)}</>);
};

const RippleGrid = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.34),q=phase(p),w=p.width,h=p.height;
  const vertex=(x:number,z:number):Point=>{const radius=Math.hypot(x-.3*Math.sin(q),z-.8);const lift=Math.sin(radius*11-t*2+q)*.055*Math.exp(-radius*.5);const scale=.16+z*.63;return [w*.5+x*w*scale,h*(.18+z*.72-lift)];};
  const lines:ReactElement[]=[];
  for(let i=-15;i<=15;i++)lines.push(<path key={`x${i}`} d={path(sample(90,z=>vertex(i/12,z*1.2)))} fill="none" stroke={i%5?c[0]:c[1]} strokeWidth={i%5?.8:1.8} opacity=".45"/>);
  for(let i=0;i<34;i++)lines.push(<path key={`z${i}`} d={path(sample(90,x=>vertex((x-.5)*3,i/28)))} fill="none" stroke={i%4?c[0]:c[1]} strokeWidth={i%4?.8:1.6} opacity=".4"/>);
  return surface(p,'projected-ripple-mesh-plane',lines);
};

const DotGrid = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.38),q=phase(p),w=p.width,h=p.height,cell=Math.max(16,Math.min(w,h)/19);
  const cx=w*(.5+.25*Math.sin(t+q)),cy=h*(.5+.25*Math.cos(t*.73+q));
  const dots:ReactElement[]=[];
  for(let row=0;row<=Math.ceil(h/cell);row++)for(let col=0;col<=Math.ceil(w/cell);col++){
    const x=col*cell,y=row*cell,dx=x-cx,dy=y-cy,distance=Math.max(1,Math.hypot(dx,dy));
    const pressure=Math.exp(-((distance/(Math.min(w,h)*.26))**2));
    const push=pressure*cell*(.6+.35*Math.sin(distance/cell*.55-t*2));
    dots.push(<circle key={`${row}:${col}`} cx={x+dx/distance*push} cy={y+dy/distance*push} r={cell*(.07+pressure*.12)} fill={pressure>.45?c[1]:c[0]} opacity={.25+pressure*.4}/>);
  }
  return surface(p,'proximity-shock-dot-lattice',dots);
};

const Threads = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.28),q=phase(p),w=p.width,h=p.height;
  return surface(p,'interwoven-horizontal-thread-bundles',Array.from({length:58},(_,k)=>{
    const family=k%2,offset=(Math.floor(k/2)-14)/28;
    const points=sample(125,u=>{const pinch=.12+.88*Math.sin(u*Math.PI)**2;const sweep=Math.sin(u*TAU*.75+t+q+family*1.2)*h*.12;return [u*w,h*.5+offset*h*.85*pinch+sweep+Math.sin(u*17-t+k*.08)*h*.013];});
    return <path key={k} d={path(points)} fill="none" stroke={family?c[0]:c[1]} strokeWidth={k%7===0?1.4:.65} opacity={k%7===0?.58:.22}/>;
  }));
};

const LiquidChrome = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.3),q=phase(p),w=p.width,h=p.height;
  const edge=(x:number,k:number)=>h*(k/11+.065*Math.sin(x*7+t+q+k*.35)+.023*Math.sin(x*19-t*.8+k*.6));
  return surface(p,'continuous-molten-chrome-contours',<><defs><linearGradient id={id(p)} x1="0" y1="0" x2="0" y2="1"><stop stopColor={c[2]}/><stop offset=".23" stopColor={c[1]}/><stop offset=".36" stopColor={c[0]}/><stop offset=".42" stopColor={c[2]}/><stop offset=".64" stopColor={c[0]}/><stop offset="1" stopColor={c[2]}/></linearGradient></defs>
    {Array.from({length:14},(_,i)=>{const k=i-1;const top=sample(95,x=>[x*w,edge(x,k)]);const bottom=sample(95,x=>[x*w,edge(x,k+1)]).reverse();return <path key={i} d={path([...top,...bottom],true)} fill={`url(#${id(p)})`} opacity=".62"/>;})}
  </>);
};

const Prism = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.19),q=phase(p),w=p.width,h=p.height,s=Math.min(w,h)*.36;
  const angle=t+q, project=(x:number,y:number,z:number):Point=>{const xx=x*Math.cos(angle)-z*Math.sin(angle),zz=x*Math.sin(angle)+z*Math.cos(angle);const scale=1/(1-zz*.16);return [w*.5+xx*s*scale,h*.55+y*s*scale+zz*s*.14];};
  const apex=project(0,-1,0),base=[project(-.9,.65,-.65),project(.9,.65,-.65),project(.9,.65,.65),project(-.9,.65,.65)];
  return surface(p,'rotating-luminous-pyramid-facets',<><defs>{gradient(p,'facet',Math.sin(t+q)*40)}{blur(p,7)}</defs>
    <path d={path([apex,...base,apex],true)} fill="none" stroke={c[0]} strokeWidth="12" opacity=".16" filter={`url(#${id(p,'blur')})`}/>
    {[0,1,2,3].map(i=><path key={i} d={path([apex,base[i],base[(i+1)%4]],true)} fill={`url(#${id(p,'facet')})`} fillOpacity={.09+i*.025} stroke={i%2?c[0]:c[1]} strokeWidth="1.4" strokeOpacity=".65"/>)}
    {[.25,.5,.75].map(v=><path key={v} d={path(base.map(b=>[apex[0]+(b[0]-apex[0])*v,apex[1]+(b[1]-apex[1])*v] as Point),true)} fill="none" stroke={c[1]} strokeOpacity=".22"/>)}</>);
};

const DarkVeil = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.13),q=phase(p),w=p.width,h=p.height;
  return surface(p,'dark-flowing-veil-and-scanlines',<><defs>{blur(p,h*.055)}</defs><g filter={`url(#${id(p,'blur')})`}>
    {Array.from({length:8},(_,k)=>{const points=sample(100,v=>[w*(.08+k*.12+.16*Math.sin(v*5+t+q+k*.8)),v*h]);return <path key={k} d={path(points)} fill="none" stroke={k%3?c[0]:c[1]} strokeWidth={w*(.09+.03*Math.sin(t+k)**2)} opacity={.08+(k%3)*.04}/>;})}
    </g>{Array.from({length:Math.ceil(h/7)},(_,i)=><path key={i} d={`M0,${fixed(i*7+Math.sin(t+q)*.7)}H${w}`} fill="none" stroke={c[1]} strokeWidth=".5" opacity=".035"/>)}</>);
};

const GradientBlinds = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.26),q=phase(p),w=p.width,h=p.height,count=18;
  return surface(p,'gradient-folding-blind-slats',<><defs>{Array.from({length:count},(_,k)=><linearGradient key={k} id={id(p,`slat${k}`)}><stop stopColor={c[k%2]}/><stop offset={.3+.18*Math.sin(t+k*.2+q)} stopColor={c[1-k%2]}/><stop offset="1" stopColor={c[2]}/></linearGradient>)}</defs>
    {Array.from({length:count},(_,k)=>{const x=k/count*w,shift=Math.sin(t+k*.21+q)*w/count*.12;return <path key={k} d={path([[x+shift,0],[x+w/count,0],[x+w/count-shift,h],[x,h]],true)} fill={`url(#${id(p,`slat${k}`)})`} opacity={.27+.1*Math.sin(k*.5+t)**2}/>;})}
  </>);
};

const Plasma = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.32),q=phase(p),w=p.width,h=p.height,s=Math.min(w,h);
  const rings=Array.from({length:46},(_,i)=>{const depth=i/45;const cx=w*(.5+.19*Math.sin(depth*5+t+q)),cy=h*(.08+depth*.9);const radius=s*(.08+depth*.13);const points=sample(70,v=>{const a=v*TAU;const warp=1+.14*Math.sin(a*3+t-depth*6);return [cx+Math.cos(a)*radius*warp,cy+Math.sin(a)*radius*.28+Math.cos(a+t)*radius*.16];});return <path key={i} d={path(points,true)} fill="none" stroke={i%3?c[0]:c[1]} strokeWidth={.7+depth*2} opacity={.14+depth*.27}/>;});
  return surface(p,'twisting-volumetric-plasma-tube',<><defs>{blur(p,5)}</defs><g filter={`url(#${id(p,'blur')})`} opacity=".65">{rings}</g>{rings}</>);
};

const ColorBends = (p: Props): ReactElement => {
  const c=colors(p),t=time(p,.27),q=phase(p),w=p.width,h=p.height;
  return surface(p,'broad-intertwined-color-bands',<><defs>{blur(p,h*.022)}{gradient(p)}</defs>
    <g filter={`url(#${id(p,'blur')})`}>{Array.from({length:7},(_,k)=>{const middle=(x:number)=>h*(.12+k*.13+.15*Math.sin(x*5+t+q+k*.67)+.045*Math.sin(x*13-t*.5));const upper=sample(90,x=>[x*w,middle(x)-h*.052]);const lower=sample(90,x=>[x*w,middle(x)+h*.052]).reverse();return <path key={k} d={path([...upper,...lower],true)} fill={k%3===0?`url(#${id(p)})`:c[k%2]} opacity={.18+(k%3)*.075}/>;})}</g>
  </>);
};

export const catalogBackgroundEffects = {
  aurora:Aurora, 'soft-aurora':SoftAurora, silk:Silk, iridescence:Iridescence, orb:Orb,
  galaxy:Galaxy, particles:Particles, beams:Beams, 'light-rays':LightRays,
  'pixel-snow':PixelSnow, dither:Dither, 'ripple-grid':RippleGrid, 'dot-grid':DotGrid,
  threads:Threads, 'liquid-chrome':LiquidChrome, prism:Prism, 'dark-veil':DarkVeil,
  'gradient-blinds':GradientBlinds, plasma:Plasma, 'color-bends':ColorBends,
} satisfies Record<string,(props:Props)=>ReactElement>;
export type CatalogBackgroundId = keyof typeof catalogBackgroundEffects;
