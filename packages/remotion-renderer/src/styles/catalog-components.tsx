import type {ReactElement, ReactNode} from 'react';
import {PALETTES} from '../../../core/src/palettes';
import type {StyleBackdropProps} from './index';

// Original vector interpretations of component materials and choreography.
// These are abstract ornaments, not interactive controls or invented app content.
const TAU = Math.PI * 2;
const fix = (n: number): string => n.toFixed(3);
const seeded = (seed: number, index: number): number => {
  let v = (seed ^ Math.imul(index + 41, 0x9e3779b1)) >>> 0;
  v = Math.imul(v ^ (v >>> 16), 0x85ebca6b) >>> 0;
  return ((v ^ (v >>> 13)) >>> 0) / 4294967296;
};
const setup = (p: StyleBackdropProps) => {
  const palette = PALETTES[p.style.id];
  const strength = Math.min(1, Math.max(0, p.style.intensity));
  return {c: p.style.colors ?? [palette.accent, palette.line, palette.canvas] as [string, string, string],
    t: p.frame / Math.max(1, p.fps) * (.35 + strength * .65) + seeded(p.style.seed, 0) * TAU,
    strength, uid: `cc-${p.style.id}-${p.style.seed}-${Math.round(p.width)}-${Math.round(p.height)}`};
};
type Point = [number, number];
const line = (pts: Point[], close = false): string => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${fix(x)},${fix(y)}`).join('') + (close ? 'Z' : '');
const sampled = (count: number, point: (u: number) => Point): Point[] => Array.from({length: count}, (_, i) => point(i / (count - 1)));
const rotatePoint = (x: number, y: number, cx: number, cy: number, a: number): Point => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
const panel = (cx: number, cy: number, w: number, h: number, a = 0, skew = 0): string =>
  line(([[ -w / 2, -h / 2 ], [ w / 2, -h / 2 ], [ w / 2, h / 2 ], [ -w / 2, h / 2 ]] as Point[])
    .map(([x, y]) => rotatePoint(x + y * skew, y, cx, cy, a)), true);
const scene = (p: StyleBackdropProps, mechanism: string, children: ReactNode): ReactElement => {
  const {c} = setup(p);
  const s = Math.min(p.width / 1000, p.height / 600);
  return <svg data-effect={mechanism} viewBox={`0 0 ${p.width} ${p.height}`} width={p.width} height={p.height} aria-hidden="true" style={{display: 'block', overflow: 'hidden'}}>
    <rect width={p.width} height={p.height} fill={c[2]}/>
    <g transform={`translate(${fix((p.width - 1000 * s) / 2)} ${fix((p.height - 600 * s) / 2)}) scale(${fix(s)})`}>{children}</g>
  </svg>;
};
const token = (x: number, y: number, r: number, kind: number, color: string): ReactElement => {
  if (kind % 3 === 0) return <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={Math.max(1.5, r * .17)}/>;
  if (kind % 3 === 1) return <path d={line([[x, y - r], [x + r, y], [x, y + r], [x - r, y]], true)} fill="none" stroke={color} strokeWidth={Math.max(1.5, r * .15)}/>;
  return <rect x={x - r * .75} y={y - r * .75} width={r * 1.5} height={r * 1.5} rx={r * .2} fill="none" stroke={color} strokeWidth={Math.max(1.5, r * .17)}/>;
};

const AnimatedList = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  return scene(p, 'staggered-abstract-list-rows', Array.from({length: 6}, (_, i) => {
    const wave = Math.sin(t * .7 - i * .65);
    const x = 220 + wave * 26;
    const y = 88 + i * 72 + Math.sin(t * .4 + i) * 4;
    return <g key={i}>
      <rect x={x} y={y} width={550 - i * 9} height={55} rx={12} fill={c[0]} fillOpacity={.045 + (wave + 1) * .025} stroke={c[0]} strokeOpacity=".38"/>
      {token(x + 30, y + 27.5, 9 + (wave + 1) * 1.5, i, c[1])}
      <path d={`M${fix(x + 57)},${fix(y + 27)}h${fix(175 + seeded(p.style.seed, i + 1) * 120)}`} fill="none" stroke={c[1]} strokeWidth="5" strokeOpacity=".25" strokeLinecap="round"/>
      <circle cx={x + 513 - i * 9} cy={y + 27} r={3.5 + (wave + 1) * 1.2} fill={c[0]}/>
    </g>;
  }));
};

const MagicBento = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  const tiles = [[80, 85, 250, 190], [345, 85, 370, 190], [730, 85, 190, 305], [80, 290, 250, 225], [345, 290, 370, 225], [730, 405, 190, 110]];
  return scene(p, 'asymmetric-bento-glow-mosaic', tiles.map(([x, y, w, h], i) => {
    const lift = Math.sin(t * .42 + i * 1.1) * 5;
    const a = t * .45 + i + seeded(p.style.seed, i + 7);
    const cx = x + w / 2 + Math.cos(a) * w * .31;
    const cy = y + lift + h / 2 + Math.sin(a) * h * .3;
    return <g key={i}>
      <rect x={x} y={y + lift} width={w} height={h} rx="20" fill={c[0]} fillOpacity=".045" stroke={c[1]} strokeOpacity=".28"/>
      <path d={`M${x + 18},${y + lift + h * .7}Q${fix(cx)},${fix(cy)} ${x + w - 18},${y + lift + h * .3}`} fill="none" stroke={c[0]} strokeOpacity=".17" strokeWidth="2"/>
      {token(x + w / 2, y + lift + h / 2, Math.min(w, h) * .16, i, c[1])}
      <circle cx={cx} cy={cy} r="12" fill={c[0]} opacity=".08"/><circle cx={cx} cy={cy} r="2.3" fill={c[0]} opacity=".75"/>
    </g>;
  }));
};

const TiltedCard = (p: StyleBackdropProps): ReactElement => {
  const {c, t, uid} = setup(p);
  const tiltX = Math.sin(t * .41) * .22;
  const tiltY = Math.cos(t * .33) * .24;
  const project = (x: number, y: number): Point => {
    const z = x * tiltX + y * tiltY;
    const perspective = 900 / (900 - z);
    return [500 + (x + y * .065 * Math.sin(t)) * perspective, 300 + y * perspective];
  };
  const border = line([project(-235, -172), project(235, -172), project(235, 172), project(-235, 172)], true);
  return scene(p, 'perspective-tilting-abstract-plane', <>
    <defs><linearGradient id={`${uid}-shine`}><stop stopColor={c[0]} stopOpacity=".06"/><stop offset=".52" stopColor={c[1]} stopOpacity=".3"/><stop offset="1" stopColor={c[0]} stopOpacity=".08"/></linearGradient></defs>
    <path d={border} fill={`url(#${uid}-shine)`} stroke={c[1]} strokeWidth="2" strokeOpacity=".65"/>
    {Array.from({length: 9}, (_, i) => <path key={i} d={line([project(-209 + i * 52, -149), project(-209 + i * 52, 149)])} fill="none" stroke={c[0]} strokeOpacity=".17"/>)}
    <path d={line([project(-184, 50), project(0, -107), project(184, 50), project(0, 108)], true)} fill="none" stroke={c[1]} strokeOpacity=".48" strokeWidth="3"/>
  </>);
};

const SpotlightCard = (p: StyleBackdropProps): ReactElement => {
  const {c, t, uid} = setup(p);
  const x = 500 + 235 * Math.cos(t * .39);
  const y = 300 + 122 * Math.sin(t * .53);
  return scene(p, 'wandering-spotlight-card-surface', <>
    <defs><clipPath id={`${uid}-clip`}><rect x="150" y="100" width="700" height="400" rx="34"/></clipPath>
      <radialGradient id={`${uid}-light`}><stop stopColor={c[1]} stopOpacity=".32"/><stop offset=".4" stopColor={c[0]} stopOpacity=".12"/><stop offset="1" stopColor={c[0]} stopOpacity="0"/></radialGradient></defs>
    <rect x="150" y="100" width="700" height="400" rx="34" fill={c[0]} fillOpacity=".035" stroke={c[1]} strokeOpacity=".25"/>
    <g clipPath={`url(#${uid}-clip)`}>
      <circle cx={x} cy={y} r="260" fill={`url(#${uid}-light)`}/>
      {Array.from({length: 5}, (_, i) => <path key={i} d={`M${200 + i * 150},130L${340 + i * 150},470`} fill="none" stroke={c[0]} strokeOpacity=".08"/>)}
      <circle cx={x} cy={y} r={32 + Math.sin(t * .6) * 5} fill="none" stroke={c[1]} strokeOpacity=".15" strokeWidth="1.5"/>
    </g>
  </>);
};

const PixelCard = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  const pixels: ReactElement[] = [];
  for (let row = 0; row < 16; row++) for (let col = 0; col < 30; col++) {
    const seed = seeded(p.style.seed, row * 30 + col + 8);
    const wave = .5 + .5 * Math.sin(t * (.52 + seed * .32) + Math.hypot(col - 14.5, row - 7.5) * .47 + seed * 3);
    const size = 2 + wave ** 2 * (seed > .72 ? 17 : 11);
    pixels.push(<rect key={`${row}-${col}`} x={149 + col * 24 - size / 2} y={120 + row * 24 - size / 2} width={size} height={size} fill={seed > .55 ? c[0] : c[1]} opacity={.14 + seed * .56}/>);
  }
  return scene(p, 'seeded-pixel-card-shimmer-grid', <>{pixels}<rect x="124" y="95" width="752" height="410" rx="12" fill="none" stroke={c[0]} strokeOpacity=".22"/></>);
};

const GlassSurface = (p: StyleBackdropProps): ReactElement => {
  const {c, t, uid} = setup(p);
  const panes = [[176, 150, 336, 202], [490, 245, 338, 205], [345, 105, 294, 122]];
  const stripes = Array.from({length: 18}, (_, i) => <path key={i} d={`M${i * 68 - 90},40L${i * 68 + 230},560`} fill="none" stroke={i % 2 ? c[0] : c[1]} strokeWidth="3" strokeOpacity=".12"/>);
  return scene(p, 'refracting-overlapping-glass-panes', <>
    {stripes}
    {panes.map(([x, y, w, h], i) => {
      const drift = Math.sin(t * .35 + i * 1.6) * 13;
      return <g key={i}>
        <defs><clipPath id={`${uid}-pane-${i}`}><rect x={x} y={y + drift} width={w} height={h} rx="25"/></clipPath></defs>
        <rect x={x} y={y + drift} width={w} height={h} rx="25" fill={c[1]} fillOpacity=".06" stroke={c[1]} strokeOpacity=".54" strokeWidth="1.5"/>
        <g clipPath={`url(#${uid}-pane-${i})`}><g transform={`translate(${fix(Math.sin(t * .4 + i) * 15)} 0)`}>{stripes}</g></g>
        <path d={`M${x + 17},${fix(y + drift + h - 19)}Q${x + w / 2},${fix(y + drift + h - 6)} ${x + w - 17},${fix(y + drift + h - 19)}`} fill="none" stroke={c[0]} strokeOpacity=".4" strokeWidth="3"/>
      </g>;
    })}
  </>);
};

const FluidGlass = (p: StyleBackdropProps): ReactElement => {
  const {c, t, uid} = setup(p);
  const cx = 510 + Math.sin(t * .23) * 75;
  const cy = 300 + Math.cos(t * .29) * 32;
  const outline = line(sampled(81, u => {
    const a = u * TAU;
    const r = 1 + .065 * Math.sin(a * 3 + t * .52) + .04 * Math.cos(a * 5 - t * .27);
    return [cx + Math.cos(a) * 167 * r, cy + Math.sin(a) * 160 * r];
  }), true);
  const field = (refract: boolean) => Array.from({length: 19}, (_, i) => <path key={i} d={line(sampled(40, u => {
    const x = 60 + 880 * u;
    const lens = refract ? Math.exp(-(((x - cx) / 210) ** 2)) * Math.sin(t * .4 + i * .2) * 34 : 0;
    return [x, 75 + i * 25 + Math.sin(u * 7 + t * .21 + i * .07) * 13 + lens];
  }))} fill="none" stroke={i % 2 ? c[0] : c[1]} strokeWidth={refract ? 3 : 1.4} strokeOpacity={refract ? .5 : .2}/>);
  return scene(p, 'breathing-fluid-glass-refraction-lens', <>
    <defs><clipPath id={`${uid}-lens`}><path d={outline}/></clipPath></defs>
    {field(false)}<path d={outline} fill={c[2]} opacity=".8"/>
    <g clipPath={`url(#${uid}-lens)`}>{field(true)}</g>
    <path d={outline} fill={c[1]} fillOpacity=".045" stroke={c[1]} strokeWidth="2" strokeOpacity=".65"/>
    <ellipse cx={cx - 72} cy={cy - 81} rx={32 + Math.sin(t) * 5} ry="10" transform={`rotate(-36 ${fix(cx - 72)} ${fix(cy - 81)})`} fill={c[1]} opacity=".19"/>
  </>);
};

const Stack = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  return scene(p, 'breathing-fan-stack-of-abstract-cards', Array.from({length: 6}, (_, i) => {
    const angle = (i - 2.5) * (.075 + .015 * Math.sin(t * .4)) + Math.sin(t * .27) * .025;
    const x = 500 + (i - 2.5) * 20 + Math.sin(t * .37 + i) * 3;
    const y = 302 - i * 7;
    return <g key={i}>
      <path d={panel(x, y, 338, 310, angle)} fill={c[2]} stroke={i % 2 ? c[0] : c[1]} strokeOpacity=".55" strokeWidth="2"/>
      <path d={panel(x, y, 300, 272, angle)} fill={c[0]} fillOpacity={.03 + i * .006} stroke={c[1]} strokeOpacity=".12"/>
      <path d={line([rotatePoint(-112, -87, x, y, angle), rotatePoint(112, 87, x, y, angle)])} fill="none" stroke={c[1]} strokeOpacity=".2" strokeWidth="3"/>
    </g>;
  }));
};

const CardSwap = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  const cards = Array.from({length: 3}, (_, i) => {
    const a = i / 3 * TAU + t * .45;
    return {i, a, z: Math.sin(a), x: 500 + Math.cos(a) * 135, y: 300 - Math.sin(a) * 55};
  }).sort((a, b) => a.z - b.z);
  return scene(p, 'three-card-orbital-depth-swap', cards.map(card => {
    const angle = -.12 + Math.sin(card.a) * .045;
    const scale = .91 + (card.z + 1) * .045;
    return <g key={card.i}>
      <path d={panel(card.x, card.y, 365 * scale, 272 * scale, angle, .11)} fill={c[2]} stroke={card.i % 2 ? c[0] : c[1]} strokeWidth="2" strokeOpacity=".58"/>
      <path d={panel(card.x, card.y, 312 * scale, 218 * scale, angle, .11)} fill={card.i % 2 ? c[0] : c[1]} opacity=".065"/>
      {token(card.x, card.y, 37 + card.i * 4, card.i, c[1])}
    </g>;
  }));
};

const BounceCards = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  return scene(p, 'staggered-spring-bouncing-card-fan', Array.from({length: 5}, (_, i) => {
    const phase = t * .72 - i * .57;
    const bounce = Math.sin(phase) * 19 + Math.sin(phase * 2) * 5;
    const x = 220 + i * 140;
    const y = 317 + bounce;
    const a = (i - 2) * .058 + Math.cos(phase) * .025;
    const scale = .97 + .035 * Math.sin(phase);
    return <g key={i}>
      <path d={panel(x, y, 156 * scale, 264 * scale, a)} fill={c[2]} stroke={i % 2 ? c[0] : c[1]} strokeWidth="2" strokeOpacity=".6"/>
      <path d={panel(x, y - 20, 125 * scale, 170 * scale, a)} fill={i % 2 ? c[0] : c[1]} fillOpacity=".075"/>
      {token(x, y - 18, 25 * scale, i, c[0])}
    </g>;
  }));
};

const Dock = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  const focus = 500 + 270 * Math.sin(t * .48);
  return scene(p, 'travelling-magnification-token-dock', <>
    <rect x="136" y="358" width="728" height="112" rx="31" fill={c[0]} fillOpacity=".05" stroke={c[1]} strokeOpacity=".26"/>
    {Array.from({length: 7}, (_, i) => {
      const x = 212 + i * 96;
      const proximity = Math.exp(-(((x - focus) / 125) ** 2));
      const size = 61 + 30 * proximity;
      const y = 403 - size / 2 - proximity * 27;
      return <g key={i}>
        <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={size * .2} fill={c[2]} stroke={c[0]} strokeOpacity=".62" strokeWidth="2"/>
        {token(x, y, size * .19, i, c[1])}<ellipse cx={x} cy="443" rx={3 + proximity * 4} ry="2" fill={c[1]} opacity=".58"/>
      </g>;
    })}
  </>);
};

const GooeyNav = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  const active = 500 + 267 * Math.sin(t * .46);
  // Account for scene's contain transform so this remains at 72% in portrait too.
  const baseline = 300 + .22 * p.height / Math.min(p.width / 1000, p.height / 600);
  const cy = baseline + Math.sin(t * .67) * 6;
  return scene(p, 'organic-merging-navigation-token-blobs', <>
    {Array.from({length: 5}, (_, i) => {
      const x = 230 + i * 135;
      const distance = Math.abs(x - active);
      const r = 23 + 13 * Math.exp(-((distance / 125) ** 2));
      const neck = Math.max(0, 1 - distance / 200) * 15;
      return <g key={i}>
        {neck > 0 ? <path d={`M${fix(x)},${fix(baseline - neck)}C${fix(x + (active - x) * .4)},${fix(baseline - neck)} ${fix(active - (active - x) * .4)},${fix(cy - 26)} ${fix(active)},${fix(cy - 30)}L${fix(active)},${fix(cy + 30)}C${fix(active - (active - x) * .4)},${fix(cy + 26)} ${fix(x + (active - x) * .4)},${fix(baseline + neck)} ${fix(x)},${fix(baseline + neck)}Z`} fill={c[0]} opacity=".25"/> : null}
        <circle cx={x} cy={baseline} r={r} fill={c[0]} fillOpacity=".22" stroke={c[1]} strokeOpacity=".75" strokeWidth="2"/>
        {token(x, baseline, 8, i, c[1])}
      </g>;
    })}
    <ellipse cx={active} cy={cy} rx={43 + Math.cos(t * .67) * 4} ry="35" fill={c[0]} fillOpacity=".32" stroke={c[0]} strokeOpacity=".85" strokeWidth="2.5"/>
    {Array.from({length: 9}, (_, i) => <circle key={i} cx={active + Math.cos(i / 9 * TAU + t * .5) * (59 + 7 * Math.sin(t + i))} cy={cy + Math.sin(i / 9 * TAU + t * .5) * 48} r={1.5 + seeded(p.style.seed, i + 10) * 2} fill={c[1]} opacity=".68"/>)}
  </>);
};

const Stepper = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  const progress = .5 + .5 * Math.sin(t * .37);
  const beadX = 140 + 720 * progress;
  const baseline = 300 + .22 * p.height / Math.min(p.width / 1000, p.height / 600);
  const y = baseline + Math.sin(t * .21) * 7;
  return scene(p, 'connected-step-tokens-with-travelling-progress', <>
    <path d={`M140,${fix(y)}H860`} fill="none" stroke={c[1]} strokeOpacity=".4" strokeWidth="3"/>
    <path d={`M140,${fix(y)}H${fix(beadX)}`} fill="none" stroke={c[0]} strokeOpacity=".85" strokeWidth="4"/>
    {Array.from({length: 6}, (_, i) => {
      const x = 140 + i * 144;
      const pulse = Math.exp(-(((x - beadX) / 95) ** 2));
      return <g key={i}><circle cx={x} cy={y} r={28 + pulse * 6} fill={c[2]} stroke={c[1]} strokeWidth="3" strokeOpacity=".85"/>
        {token(x, y, 8 + pulse * 4, i, c[0])}<path d={`M${x - 13},${fix(y + 55)}h26`} fill="none" stroke={c[1]} strokeOpacity=".4" strokeWidth="3" strokeLinecap="round"/></g>;
    })}
    <circle cx={beadX} cy={y} r="5" fill={c[0]}/>
  </>);
};

const Folder = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  const opening = .5 + .5 * Math.sin(t * .43);
  const frontY = 295 + opening * 47;
  return scene(p, 'opening-folder-and-fanning-blank-sheets', <>
    <path d="M275,247V191Q275,177 291,177H424L454,208H711Q727,208 727,225V474H275Z" fill={c[0]} fillOpacity=".12" stroke={c[0]} strokeOpacity=".58" strokeWidth="2"/>
    {Array.from({length: 3}, (_, i) => {
      const a = (i - 1) * (.045 + opening * .08);
      const y = 306 - (i + 1) * (15 + opening * 17);
      const x = 500 + (i - 1) * opening * 35;
      return <g key={i}><path d={panel(x, y, 326, 232, a)} fill={c[2]} stroke={c[1]} strokeOpacity=".52" strokeWidth="2"/>
        <path d={panel(x, y, 287, 193, a)} fill={c[1]} fillOpacity=".055"/></g>;
    })}
    <path d={`M258,${fix(frontY)}Q258,${fix(frontY - 14)} 274,${fix(frontY - 14)}H730Q746,${fix(frontY - 14)} 744,${fix(frontY)}L726,474H275Z`} fill={c[2]} stroke={c[0]} strokeOpacity=".65" strokeWidth="2"/>
    <path d={`M258,${fix(frontY)}H744L726,474H275Z`} fill={c[0]} opacity=".1"/>
    <circle cx="500" cy={frontY + (474 - frontY) * .47} r="13" fill="none" stroke={c[1]} strokeOpacity=".6" strokeWidth="2"/>
  </>);
};

const ElasticSlider = (p: StyleBackdropProps): ReactElement => {
  const {c, t} = setup(p);
  const x = 500 + 268 * Math.sin(t * .47);
  const baseline = 300 + .22 * p.height / Math.min(p.width / 1000, p.height / 600);
  const y = baseline - 10 + Math.sin(t * .73) * 20;
  const bend = Math.sin(t * .47) * 22;
  const d = `M145,${fix(baseline)}Q${fix((145 + x) / 2)},${fix(baseline + bend)} ${fix(x)},${fix(y)}Q${fix((855 + x) / 2)},${fix(baseline - bend)} 855,${fix(baseline)}`;
  return scene(p, 'elastic-tension-rail-and-orbiting-thumb', <>
    <path d={d} fill="none" stroke={c[0]} strokeWidth="15" strokeOpacity=".12" strokeLinecap="round"/>
    <path d={d} fill="none" stroke={c[1]} strokeWidth="4" strokeOpacity=".8" strokeLinecap="round"/>
    <circle cx={x} cy={y} r={26 + Math.sin(t * .94) * 2} fill={c[2]} stroke={c[0]} strokeWidth="3.5" strokeOpacity=".95"/>
    <circle cx={x} cy={y} r="8" fill={c[1]} opacity=".7"/>
    {token(104, baseline, 13, 1, c[0])}{token(896, baseline, 13, 0, c[0])}
    <path d={`M${fix(x - 8)},${fix(y + 46)}L${fix(x)},${fix(y + 52)}L${fix(x + 8)},${fix(y + 46)}`} fill="none" stroke={c[1]} strokeOpacity=".5"/>
  </>);
};

export const catalogComponentEffects = {
  'animated-list': AnimatedList,
  'magic-bento': MagicBento,
  'tilted-card': TiltedCard,
  'spotlight-card': SpotlightCard,
  'pixel-card': PixelCard,
  'glass-surface': GlassSurface,
  'fluid-glass': FluidGlass,
  stack: Stack,
  'card-swap': CardSwap,
  'bounce-cards': BounceCards,
  dock: Dock,
  'gooey-nav': GooeyNav,
  stepper: Stepper,
  folder: Folder,
  'elastic-slider': ElasticSlider,
} as const;
