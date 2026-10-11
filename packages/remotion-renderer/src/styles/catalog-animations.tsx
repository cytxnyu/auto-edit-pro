import type {ReactElement, ReactNode} from 'react';
import {PALETTES} from '../../../core/src/palettes';
import type {StyleBackdropProps} from './index';

/** Original decorative interpretations of the referenced mechanisms, not upstream
 * widgets. All trajectories are analytic: no interaction or earlier frame is needed. */
const TAU = Math.PI * 2;
const clamp = (v: number): number => Math.max(0, Math.min(1, v));
const mod = (v: number, span = 1): number => ((v % span) + span) % span;
const f = (v: number): string => v.toFixed(3);
const sample = (seed: number, index: number): number => {
  let n = Math.imul((seed ^ Math.imul(index + 2741, 1597334677)) >>> 0, 2246822519);
  n = Math.imul(n ^ (n >>> 15), 3266489917);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const colors = (p: StyleBackdropProps): [string, string, string] => {
  const palette = PALETTES[p.style.id];
  return p.style.colors ?? [palette.accent, palette.line, palette.canvas];
};
const time = (p: StyleBackdropProps, speed = 1): number => p.frame / p.fps * speed * (.45 + .55 * clamp(p.style.intensity));
const phase = (p: StyleBackdropProps, index = 1): number => sample(p.style.seed, index) * TAU;
const unit = (p: StyleBackdropProps): number => Math.min(p.width, p.height);
const uid = (p: StyleBackdropProps, suffix: string): string => `animation-${p.style.id}-${p.style.seed}-${p.width}-${p.height}-${suffix}`;
type Point = [number, number];
const path = (points: Point[], close = false): string => points.map(([x,y], i) => `${i ? 'L' : 'M'}${f(x)},${f(y)}`).join('') + (close ? 'Z' : '');
const canvas = (p: StyleBackdropProps, mechanism: string, content: ReactNode): ReactElement => <svg data-effect={mechanism} data-interpretation="original-decorative-choreography" width={p.width} height={p.height} viewBox={`0 0 ${p.width} ${p.height}`} style={{display: 'block', overflow: 'hidden'}}>
  <rect width={p.width} height={p.height} fill={colors(p)[2]}/>{content}
</svg>;
const orbit = (p: StyleBackdropProps, t: number, offset = 0): Point => [
  p.width * (.5 + .34 * Math.sin(t * .71 + phase(p) + offset)),
  p.height * (.5 + .3 * Math.sin(t * 1.03 + phase(p, 2) + offset * .7)),
];

const MagicRings = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .65), u = unit(p), rotation = t * 13 + phase(p) * 15;
  const [cx,cy] = [p.width * .5, p.height * .5];
  return canvas(p, 'concentric-breathing-ring-waves', <g transform={`rotate(${f(rotation)},${cx},${cy})`}>
    {Array.from({length: 9}, (_, i) => {
      const q = mod(i / 9 + t * .065 + sample(p.style.seed, 11) * .2);
      const r = u * (.09 + q * .62), pulse = .5 + .5 * Math.sin(t * 1.9 + i * .61 + phase(p, 3));
      const opacity = Math.sin(Math.PI * q) * .74;
      return <g key={i} opacity={opacity}>
        <ellipse cx={cx} cy={cy} rx={r * (1 + .07 * pulse)} ry={r * .75} fill="none" stroke={c[i % 2]} strokeWidth={1 + pulse * 2.2}/>
        <ellipse cx={cx} cy={cy} rx={r * (1 + .07 * pulse)} ry={r * .75} fill="none" stroke={c[1 - i % 2]} strokeWidth="5" opacity=".13"/>
        <path d={`M${f(cx + r * Math.cos(t + i))},${f(cy + r * .75 * Math.sin(t + i))}l${f(u * .011)},${f(u * .002)}`} fill="none" stroke={c[1]} strokeWidth="2.5"/>
      </g>;
    })}
  </g>);
};

const LaserFlow = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p), u = unit(p), bendX = p.width * (.58 + .04 * Math.sin(t * .38 + phase(p))), beamY = p.height * .23;
  const radius = u * .14, glow = uid(p, 'glow');
  const beam = `M${-p.width * .05},${beamY}H${f(bendX - radius)}Q${f(bendX)},${beamY} ${f(bendX)},${f(beamY + radius)}V${p.height * 1.08}`;
  return canvas(p, 'right-angle-laser-and-downflow-wisps', <>
    <defs><filter id={glow} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={u * .018}/></filter></defs>
    <path d={beam} fill="none" stroke={c[1]} strokeWidth={u * .064} opacity=".27" filter={`url(#${glow})`}/>
    <path d={beam} fill="none" stroke={c[0]} strokeWidth={u * .014} opacity=".55"/>
    <path d={beam} fill="none" stroke={c[1]} strokeWidth={Math.max(1, u * .003)}/>
    {Array.from({length: 24}, (_, i) => {
      const q = mod(sample(p.style.seed, i + 19) + t * (.08 + sample(p.style.seed, i + 60) * .11));
      const y = beamY + q * p.height, spread = u * (.025 + q * .14), x = bendX + Math.sin(i * 2.37 + t * .78) * spread;
      return <path key={i} d={`M${f(x)},${f(y)}q${f(Math.sin(i + t) * spread * .45)},${f(u * .075)} ${f(Math.cos(i * 2 + t) * spread * .3)},${f(u * .15)}`} fill="none" stroke={c[i % 2]} strokeWidth={.8 + q * 2} opacity={(1 - q) * .52}/>;
    })}
  </>);
};

const MagnetLines = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .7), u = unit(p), [tx,ty] = orbit(p, t), gap = u / 11;
  const lines: ReactElement[] = [];
  for (let row = 0; row <= Math.ceil(p.height / gap); row++) for (let col = 0; col <= Math.ceil(p.width / gap); col++) {
    const x = col * gap, y = row * gap, a = Math.atan2(ty - y, tx - x) + .13 * Math.sin(t + row * .3 + phase(p, 7));
    const half = gap * (.25 + .08 * Math.sin(row + col + t));
    lines.push(<path key={`${row}:${col}`} d={`M${f(x - Math.cos(a) * half)},${f(y - Math.sin(a) * half)}L${f(x + Math.cos(a) * half)},${f(y + Math.sin(a) * half)}`} fill="none" stroke={c[(row + col) % 3 ? 0 : 1]} strokeWidth={Math.max(1.6, gap * .07)} strokeLinecap="round" opacity=".72"/>);
  }
  return canvas(p, 'magnetic-needle-orientation-field', lines);
};

const Antigravity = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .58), u = unit(p), [tx,ty] = orbit(p, t, .7);
  return canvas(p, 'repelling-particle-ring-field', Array.from({length: 175}, (_, i) => {
    const bx = sample(p.style.seed, i * 4) * p.width, by = sample(p.style.seed, i * 4 + 1) * p.height;
    const dx = bx - tx, dy = by - ty, d = Math.max(1, Math.hypot(dx,dy)), a = Math.atan2(dy,dx);
    const force = Math.exp(-d * d / (u * u * .14)) * u * (.16 + p.style.intensity * .12);
    const x = bx + dx / d * force + Math.sin(t * 1.3 + i) * u * .008;
    const y = by + dy / d * force + Math.cos(t * .8 + i * 2) * u * .012;
    const length = u * (.009 + .014 * sample(p.style.seed, i * 4 + 2));
    return <path key={i} d={`M${f(x)},${f(y)}l${f(Math.cos(a + t * .07) * length)},${f(Math.sin(a + t * .07) * length)}`} fill="none" stroke={c[i % 5 ? 0 : 1]} strokeWidth={1 + sample(p.style.seed, i * 4 + 3) * u * .004} strokeLinecap="round" opacity={.3 + .6 * sample(p.style.seed, i + 991)}/>;
  }));
};

const Ribbons = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .82), u = unit(p);
  return canvas(p, 'tapered-analytic-ribbon-trails', Array.from({length: 6}, (_, ribbon) => {
    const edgeA: Point[] = [], edgeB: Point[] = [];
    for (let i = 0; i < 70; i++) {
      const age = i / 69, tt = t - age * 3.3 - ribbon * .06;
      const current = orbit(p, tt, ribbon * .045), next = orbit(p, tt + .008, ribbon * .045);
      const angle = Math.atan2(next[1] - current[1], next[0] - current[0]) + Math.PI / 2;
      const thickness = u * (.014 + p.style.intensity * .009) * (1 - age) ** .85;
      edgeA.push([current[0] + Math.cos(angle) * thickness, current[1] + Math.sin(angle) * thickness]);
      edgeB.push([current[0] - Math.cos(angle) * thickness, current[1] - Math.sin(angle) * thickness]);
    }
    return <path key={ribbon} d={path([...edgeA, ...edgeB.reverse()], true)} fill={c[ribbon % 2]} opacity={.38 + ribbon * .075}/>;
  }));
};

const MetaBalls = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .55), u = unit(p), goo = uid(p, 'merge');
  return canvas(p, 'merging-metaball-contours', <>
    <defs><filter id={goo} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={u * .034}/><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7"/></filter></defs>
    <g filter={`url(#${goo})`}>
      {Array.from({length: 12}, (_, i) => {
        const a = t * (.23 + sample(p.style.seed, i + 18) * .4) + sample(p.style.seed, i) * TAU;
        const x = p.width * .5 + Math.cos(a) * p.width * (.12 + sample(p.style.seed, i + 40) * .19);
        const y = p.height * .5 + Math.sin(a * 1.2 + i) * p.height * .24;
        return <circle key={i} cx={x} cy={y} r={u * (.055 + sample(p.style.seed, i + 90) * .052)} fill={c[i % 2]}/>;
      })}
    </g>
  </>);
};

const perimeter = (p: StyleBackdropProps, q: number, inset: number): Point => {
  const w = p.width - inset * 2, h = p.height - inset * 2, d = mod(q) * (w + h) * 2;
  if (d < w) return [inset + d, inset];
  if (d < w + h) return [p.width - inset, inset + d - w];
  if (d < w * 2 + h) return [p.width - inset - (d - w - h), p.height - inset];
  return [inset, p.height - inset - (d - w * 2 - h)];
};
const StarBorder = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .63), u = unit(p), inset = u * .045;
  return canvas(p, 'travelling-star-glints-on-perimeter', <>
    <rect x={inset} y={inset} width={p.width - 2 * inset} height={p.height - 2 * inset} rx={u * .035} fill="none" stroke={c[1]} strokeWidth="1.3" opacity=".42"/>
    {[0,1].map(side => <g key={side}>{Array.from({length: 35}, (_, i) => {
      const q = t * .12 + phase(p) / TAU + side * .5 - i * .0017;
      const [x,y] = perimeter(p, q, inset), size = u * (.003 + .013 * (1 - i / 35));
      return <path key={i} d={`M${f(x - size * 2)},${f(y)}Q${f(x)},${f(y - size * .3)} ${f(x)},${f(y - size * 2)}Q${f(x + size * .3)},${f(y)} ${f(x + size * 2)},${f(y)}Q${f(x)},${f(y + size * .3)} ${f(x)},${f(y + size * 2)}Q${f(x - size * .3)},${f(y)} ${f(x - size * 2)},${f(y)}Z`} fill={c[side]} opacity={(1 - i / 35) * .8}/>;
    })}</g>)}
  </>);
};

const PixelTrail = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, 1.1), cell = unit(p) / 28;
  return canvas(p, 'quantized-square-motion-afterimage', Array.from({length: 67}, (_, i) => {
    const [ox,oy] = orbit(p, t - i * .034), x = Math.floor(ox / cell) * cell, y = Math.floor(oy / cell) * cell;
    const size = cell * (.24 + .74 * (1 - i / 67));
    return <rect key={i} x={x + (cell - size) / 2} y={y + (cell - size) / 2} width={size} height={size} fill={c[i % 7 ? 0 : 1]} opacity={(1 - i / 67) * .83}/>;
  }));
};

const Noise = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), tick = Math.floor(time(p) * 11), count = 1000;
  const paths = ['', ''];
  for (let i = 0; i < count; i++) {
    const key = i * 4 + tick * 7919, x = sample(p.style.seed, key) * p.width, y = sample(p.style.seed, key + 1) * p.height;
    const size = Math.max(1, unit(p) * (.0015 + sample(p.style.seed, key + 2) * .004));
    paths[i % 2] += `M${f(x)},${f(y)}h${f(size)}v${f(size)}h${f(-size)}Z`;
  }
  return canvas(p, 'seeded-refreshing-grain-particles', paths.map((d,i) => <path key={i} d={d} fill={c[i]} opacity={i ? .22 : .33}/>));
};

const ShapeBlur = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .6), u = unit(p), [x,y] = orbit(p, t), blur = uid(p, 'soft'), focus = uid(p, 'focus');
  const shape = <g transform={`rotate(${f(Math.sin(t * .41 + phase(p)) * 8)},${p.width / 2},${p.height / 2})`}>
    <rect x={p.width * .5 - u * .28} y={p.height * .5 - u * .28} width={u * .56} height={u * .56} rx={u * .1} fill="none" stroke={c[0]} strokeWidth={u * .026}/>
    <circle cx={p.width * .5} cy={p.height * .5} r={u * (.105 + .012 * Math.sin(t * 1.3 + phase(p, 3)))} fill="none" stroke={c[1]} strokeWidth={u * .018}/>
  </g>;
  return canvas(p, 'moving-local-soft-edge-shape', <>
    <defs><filter id={blur}><feGaussianBlur stdDeviation={u * (.012 + p.style.intensity * .009)}/></filter><radialGradient id={focus} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={u * .37}><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#000"/></radialGradient><mask id={`${focus}-mask`}><rect width={p.width} height={p.height} fill={`url(#${focus})`}/></mask></defs>
    <g opacity=".6">{shape}</g><g filter={`url(#${blur})`} mask={`url(#${focus}-mask)`}>{shape}</g>
  </>);
};

const Crosshair = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .56), [x,y] = orbit(p,t), u = unit(p), gap = u * (.026 + .005 * Math.sin(t * 3 + phase(p, 9)));
  return canvas(p, 'analytical-crosshair-and-calibration-marks', <>
    <path d={`M0,${f(y)}H${f(x - gap)}M${f(x + gap)},${f(y)}H${p.width}M${f(x)},0V${f(y - gap)}M${f(x)},${f(y + gap)}V${p.height}`} fill="none" stroke={c[0]} strokeWidth="1.2" opacity=".65"/>
    <path d={`M${f(x - gap * .6)},${f(y - gap)}h${f(-gap * .4)}v${f(gap * .4)}M${f(x + gap * .6)},${f(y + gap)}h${f(gap * .4)}v${f(-gap * .4)}`} fill="none" stroke={c[1]} strokeWidth="2.4"/>
    {Array.from({length: 17}, (_, i) => <path key={i} d={`M${f(i / 16 * p.width)},${f(y - (i % 4 ? 4 : 9))}v${i % 4 ? 8 : 18}M${f(x - (i % 4 ? 4 : 9))},${f(i / 16 * p.height)}h${i % 4 ? 8 : 18}`} fill="none" stroke={c[1]} strokeWidth="1" opacity=".36"/>)}
  </>);
};

const ClickSpark = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .9), u = unit(p);
  return canvas(p, 'scheduled-radial-spark-bursts', [0,1,2].map(burst => {
    const age = mod(t * .52 + burst / 3 + sample(p.style.seed, burst + 3)), cycle = Math.floor(t * .52 + burst / 3 + sample(p.style.seed, burst + 3));
    const x = p.width * (.2 + .6 * sample(p.style.seed, burst * 7 + cycle * 17 + 110));
    const y = p.height * (.22 + .56 * sample(p.style.seed, burst * 7 + cycle * 17 + 111));
    const radius = u * (.02 + (1 - (1 - age) ** 2) * .23), length = u * (.012 + (1 - age) * .035);
    return <g key={burst} opacity={Math.sin(Math.PI * age) * .78}>{Array.from({length: 12}, (_, ray) => {
      const a = ray / 12 * TAU + phase(p, burst + 9), r = radius + Math.sin(t + ray) * u * .005;
      return <path key={ray} d={`M${f(x + Math.cos(a) * r)},${f(y + Math.sin(a) * r)}l${f(Math.cos(a) * length)},${f(Math.sin(a) * length)}`} fill="none" stroke={c[(ray + burst) % 2]} strokeWidth={u * .003} strokeLinecap="round"/>;
    })}</g>;
  }));
};

const PixelTransition = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .78), cols = 18, rows = Math.max(7, Math.round(cols * p.height / p.width)), w = p.width / cols, h = p.height / rows;
  return canvas(p, 'staggered-pixel-shutter-exchange', Array.from({length: cols * rows}, (_, i) => {
    const col = i % cols, row = Math.floor(i / cols), delay = sample(p.style.seed, i) * 1.5;
    const a = t * 1.4 - delay - col * .09, scale = .08 + .9 * (.5 + .5 * Math.sin(a)) ** 2;
    const x = col * w + w * (1 - scale) / 2, y = row * h + h * (1 - scale) / 2;
    return <rect key={i} x={x} y={y} width={w * scale * .94} height={h * scale * .94} fill={c[(col + row + Math.floor((a + Math.PI) / TAU)) % 2 === 0 ? 0 : 1]} opacity=".72"/>;
  }));
};

const GlareHover = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .72), u = unit(p), band = uid(p, 'sheen'), clip = uid(p, 'panel');
  const x = p.width * (.5 + .7 * Math.sin(t * .55 + phase(p))), angle = -28 + Math.sin(t * .2 + phase(p, 3)) * 7;
  return canvas(p, 'diagonal-reflective-sheen-sweep', <>
    <defs><linearGradient id={band}><stop stopColor={c[1]} stopOpacity="0"/><stop offset=".46" stopColor={c[0]} stopOpacity=".1"/><stop offset=".5" stopColor={c[1]} stopOpacity=".7"/><stop offset=".7" stopColor={c[0]} stopOpacity=".2"/><stop offset="1" stopColor={c[1]} stopOpacity="0"/></linearGradient><clipPath id={clip}><rect x={u * .08} y={u * .08} width={p.width - u * .16} height={p.height - u * .16} rx={u * .04}/></clipPath></defs>
    <rect x={u * .08} y={u * .08} width={p.width - u * .16} height={p.height - u * .16} rx={u * .04} fill={c[0]} fillOpacity=".1" stroke={c[1]} strokeOpacity=".35"/>
    <g clipPath={`url(#${clip})`}><rect x={x - u * .2} y={-p.height} width={u * .4} height={p.height * 3} fill={`url(#${band})`} transform={`rotate(${f(angle)},${f(x)},${p.height * .5})`}/></g>
  </>);
};

const StickerPeel = (p: StyleBackdropProps): ReactElement => {
  const c = colors(p), t = time(p, .68), u = unit(p), size = u * .57;
  const cx = p.width * .5, cy = p.height * .5, left = cx - size / 2, top = cy - size / 2;
  const fold = size * (.16 + .25 * (.5 + .5 * Math.sin(t * .87 + phase(p)))), right = left + size, bottom = top + size;
  const angle = Math.sin(t * .44 + phase(p, 4)) * 9 - 8, shine = uid(p, 'fold');
  return canvas(p, 'abstract-sticker-curl-and-fold-shadow', <g transform={`rotate(${f(angle)},${cx},${cy})`}>
    <defs><linearGradient id={shine} x1="0" y1="0" x2="1" y2="1"><stop stopColor={c[1]}/><stop offset=".6" stopColor={c[0]}/><stop offset="1" stopColor={c[2]}/></linearGradient></defs>
    <path d={`M${f(left + 8)},${f(top + 12)}H${f(right + 8)}V${f(bottom - fold + 12)}L${f(right - fold + 8)},${f(bottom + 12)}H${f(left + 8)}Z`} fill={c[1]} opacity=".16"/>
    <path d={`M${f(left)},${f(top)}H${f(right)}V${f(bottom - fold)}L${f(right - fold)},${f(bottom)}H${f(left)}Z`} fill={c[0]} stroke={c[1]} strokeWidth="2"/>
    <circle cx={cx - size * .08} cy={cy - size * .06} r={size * .19} fill="none" stroke={c[2]} strokeWidth={size * .05} opacity=".65"/>
    <path d={`M${f(right - fold)},${f(bottom)}Q${f(right - fold * 1.16)},${f(bottom - fold * .65)} ${f(right - fold * .65)},${f(bottom - fold * .84)}Q${f(right - fold * .25)},${f(bottom - fold * 1.07)} ${f(right)},${f(bottom - fold)}Z`} fill={`url(#${shine})`} stroke={c[1]} strokeWidth="1.2"/>
    <path d={`M${f(right - fold)},${f(bottom)}L${f(right)},${f(bottom - fold)}`} fill="none" stroke={c[2]} strokeWidth={size * .022} opacity=".45"/>
  </g>);
};

export const catalogAnimationEffects = {
  'magic-rings': MagicRings,
  'laser-flow': LaserFlow,
  'magnet-lines': MagnetLines,
  antigravity: Antigravity,
  ribbons: Ribbons,
  'meta-balls': MetaBalls,
  'star-border': StarBorder,
  'pixel-trail': PixelTrail,
  noise: Noise,
  'shape-blur': ShapeBlur,
  crosshair: Crosshair,
  'click-spark': ClickSpark,
  'pixel-transition': PixelTransition,
  'glare-hover': GlareHover,
  'sticker-peel': StickerPeel,
} as const;
