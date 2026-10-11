import type {ReactElement, ReactNode} from 'react';
import {PALETTES} from '../../../core/src/palettes';
import type {StyleBackdropProps} from './index';

// Original analytic geometry informed by the named visual mechanisms, not upstream source.
// All positions are functions of a saved seed and addressed video frame; no device input.
const TAU = Math.PI * 2;
const f = (n: number): string => n.toFixed(2);
const unit = (n: number): number => Math.max(0, Math.min(1, n));
const wrap = (n: number): number => n - Math.floor(n);
const seeded = (seed: number, index: number): number => {
  let value = (seed ^ Math.imul(index + 17, 0x9e3779b1)) >>> 0;
  value = Math.imul(value ^ (value >>> 15), 0x85ebca6b) >>> 0;
  return ((value ^ (value >>> 13)) >>> 0) / 4294967296;
};
const setup = ({style, frame, fps, width, height}: StyleBackdropProps) => {
  const palette = PALETTES[style.id];
  return {
    colors: style.colors ?? [palette.accent, palette.line, palette.canvas] as [string, string, string],
    strength: unit(style.intensity),
    time: frame / Math.max(1, fps),
    phase: seeded(style.seed, 1) * TAU,
    uid: `b-${style.id}-${style.seed}-${Math.round(width)}-${Math.round(height)}`,
  };
};
type Point = [number, number];
const line = (points: Point[], close = false): string => points.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)},${f(y)}`).join('') + (close ? 'Z' : '');
const points = (count: number, sample: (u: number) => Point): Point[] => Array.from({length: count}, (_, i) => sample(i / (count - 1)));
const shell = (p: StyleBackdropProps, mechanism: string, background: string, children: ReactNode): ReactElement => (
  <svg data-effect={mechanism} viewBox={`0 0 ${p.width} ${p.height}`} width={p.width} height={p.height} preserveAspectRatio="none" aria-hidden="true" style={{display: 'block', overflow: 'hidden'}}>
    <rect width={p.width} height={p.height} fill={background}/>{children}
  </svg>
);

/** Reference: /components/circular-carousel; ring perspective and depth, no content imitation. */
const CircularCarousel = (p: StyleBackdropProps): ReactElement => {
  const {colors: c, time, phase, strength} = setup(p);
  const {width: w, height: h, style} = p;
  const radius = Math.min(w * .34, h * .65);
  const orbit = time * (.16 + strength * .23) + phase;
  const camera = radius * 3.8;
  const cards = Array.from({length: 11}, (_, i) => {
    const angle = i / 11 * TAU + orbit;
    const cardW = radius * (.34 + seeded(style.seed, i + 9) * .06);
    const cardH = Math.min(h * .53, radius * .76);
    const worldX = Math.sin(angle) * radius;
    const worldZ = Math.cos(angle) * radius;
    const project = (u: number, v: number): Point => {
      const x = worldX + u * cardW * Math.cos(angle);
      const z = worldZ - u * cardW * Math.sin(angle);
      const scale = camera / (camera - z);
      return [w * .5 + x * scale, h * .49 + (v * cardH + z * .18) * scale];
    };
    return {i, z: worldZ, outline: line([project(-.5, -.5), project(.5, -.5), project(.5, .5), project(-.5, .5)], true),
      inner: line([project(-.36, -.35), project(.36, -.35), project(.36, .08), project(-.36, .08)], true),
      stripe: line([project(-.36, .25), project(.36, .25), project(.36, .34), project(-.36, .34)], true)};
  }).sort((a, b) => a.z - b.z);
  return shell(p, 'orbiting-abstract-card-ring', c[2], <>
    <ellipse cx={w / 2} cy={h * .67} rx={radius * 1.1} ry={radius * .17} fill="none" stroke={c[1]} strokeOpacity=".16"/>
    {cards.map(card => <g key={card.i} opacity={.38 + .62 * (card.z / radius + 1) / 2}>
      <path d={card.outline} fill={c[2]} stroke={card.i % 2 ? c[0] : c[1]} strokeWidth={Math.max(1, w / 750)}/>
      <path d={card.inner} fill={card.i % 2 ? c[0] : c[1]} opacity=".5"/>
      <path d={card.stripe} fill={c[1]} opacity=".78"/>
    </g>)}
  </>);
};

/** Reference: /backgrounds/micro-slats; short slat field, analytic swell replacing fluid state. */
const MicroSlats = (p: StyleBackdropProps): ReactElement => {
  const {colors: c, time, phase, strength} = setup(p);
  const {width: w, height: h, style} = p;
  const pitch = w / 43;
  const rows = Math.ceil(h / pitch) + 2;
  const faces = ['', '', '', ''];
  let glints = '';
  for (let row = -1; row < rows; row++) for (let col = -1; col < 45; col++) {
    const wave = Math.sin(col * .21 + row * .28 - time * (.7 + strength) + phase);
    const crest = Math.cos(col * .11 - row * .23 + time * .39 + phase);
    const angle = wave * (.2 + strength * .7);
    const length = pitch * (.4 + .45 * (crest + 1) / 2);
    const breadth = pitch * .2;
    const cx = col * pitch + (row % 2) * pitch * .5;
    const cy = row * pitch + wave * pitch * .21;
    const rotate = (x: number, y: number): Point => [cx + x * Math.cos(angle) - y * Math.sin(angle), cy + x * Math.sin(angle) + y * Math.cos(angle)];
    const shape = [rotate(-breadth / 2, -length / 2), rotate(breadth / 2, -length / 2), rotate(breadth / 2, length / 2), rotate(-breadth / 2, length / 2)];
    const band = Math.min(3, Math.floor((wave + 1) * 1.999));
    faces[band] += line(shape, true);
    if (crest > .23 + seeded(style.seed, row * 53 + col + 80) * .15) glints += line([shape[0], shape[1]]);
  }
  return shell(p, 'micro-slat-swell-field', c[2], <>
    {faces.map((d, i) => <path key={i} d={d} fill={c[0]} opacity={.2 + i * .21}/>)}
    <path d={glints} fill="none" stroke={c[1]} strokeWidth={Math.max(.65, pitch * .08)} strokeLinecap="round"/>
  </>);
};

/** Reference: /backgrounds/ghost-fibers; layered twisting filament field. */
const GhostFibers = (p: StyleBackdropProps): ReactElement => {
  const {colors: c, time, phase, strength} = setup(p);
  const {width: w, height: h, style} = p;
  const fibers = Array.from({length: 72}, (_, i) => {
    const layer = Math.floor(i / 18);
    const lane = i % 18;
    const drift = phase + layer * 1.5 + seeded(style.seed, i + 32) * .25;
    const d = line(points(43, u => {
      const twist = u * 5.7 + time * (.19 + strength * .31) + drift;
      const envelope = .48 + .3 * Math.sin(u * Math.PI);
      return [w * (.18 + layer * .21) + Math.sin(twist) * w * .13 * envelope + (lane - 8.5) * w * .0038 * Math.cos(twist * .73)
        + Math.sin(u * 13 - time * .28 + drift) * w * .014, h * (u * 1.2 - .1)];
    }));
    return <g key={i}><path d={d} fill="none" stroke={c[1]} strokeWidth={w * .006} opacity=".027"/>
      <path d={d} fill="none" stroke={i % 3 ? c[0] : c[1]} strokeWidth={Math.max(.45, w * .00065)} opacity={.15 + (i % 6) * .085}/></g>;
  });
  return shell(p, 'twisting-ghost-filament-curtains', c[2], fibers);
};

/** Reference: /backgrounds/acid-squares; density and wave depth expressed as chromatic contours. */
const AcidSquares = (p: StyleBackdropProps): ReactElement => {
  const {colors: c, time, phase, strength} = setup(p);
  const {width: w, height: h, style} = p;
  const pitch = Math.max(w / 19, h / 12);
  const rows = Math.ceil(h / pitch) + 2;
  const rings: ReactElement[] = [];
  for (let y = -1; y < rows; y++) for (let x = -1; x < 21; x++) {
    const cx = (x + .5) * pitch;
    const cy = (y + .5) * pitch;
    const r = Math.hypot((cx - w * .46) / pitch, (cy - h * .5) / pitch);
    const swell = Math.sin(r * .8 - time * (.6 + strength * 1.2) + phase);
    const angle = Math.sin(r * .26 + time * .22 + phase) * .14 * strength;
    const size = pitch * (.43 + swell * .11);
    for (let layer = 0; layer < 3; layer++) {
      const half = size * (1 - layer * .25);
      const offset = swell * pitch * .11 * layer;
      const corners: Point[] = [[-half, -half], [half, -half], [half, half], [-half, half]];
      const d = line(corners.map(([xx, yy]) => [cx + xx * Math.cos(angle) - yy * Math.sin(angle) + offset, cy + xx * Math.sin(angle) + yy * Math.cos(angle) - offset]), true);
      rings.push(<path key={`${x}-${y}-${layer}`} d={d} fill="none" stroke={layer % 2 ? c[1] : c[0]} strokeWidth={layer === 0 ? pitch * .038 : pitch * .019}
        opacity={.22 + (1 - layer / 3) * .55 + seeded(style.seed, (y + 2) * 61 + x + 9) * .08}/>);
    }
  }
  return shell(p, 'chromatic-square-ripple-contours', c[2], rings);
};

/** Reference: /backgrounds/light-tunnel; radial cables and depth-travelling light pulses. */
const LightTunnel = (p: StyleBackdropProps): ReactElement => {
  const {colors: c, time, phase, strength} = setup(p);
  const {width: w, height: h, style} = p;
  const cx = w * (.5 + .025 * Math.sin(time * .21 + phase));
  const cy = h * (.5 + .035 * Math.cos(time * .17 + phase));
  const extent = Math.hypot(w, h) * .72;
  const cables = Array.from({length: 26}, (_, i) => {
    const offset = seeded(style.seed, i + 16);
    const base = i / 26 * TAU + phase * .2;
    const at = (u: number): Point => {
      const radius = 8 + (Math.exp(u * 4.2) - 1) / (Math.exp(4.2) - 1) * extent;
      const a = base + Math.sin(u * 4.1 - time * .31 + offset * TAU) * (.03 + strength * .06);
      return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
    };
    const head = wrap(time * (.15 + strength * .22) + offset);
    const pulse = line(points(12, u => at(Math.max(0, head - .14) + u * Math.min(head, .14))));
    return <g key={i}>
      <path d={line(points(35, at))} fill="none" stroke={c[0]} strokeWidth={Math.max(.6, w * .0008)} opacity=".43"/>
      <path d={pulse} fill="none" stroke={c[1]} strokeWidth={w * .006} strokeLinecap="round" opacity=".08"/>
      <path d={pulse} fill="none" stroke={i % 3 ? c[1] : c[0]} strokeWidth={Math.max(1.2, w * .0017)} strokeLinecap="round" opacity={Math.min(1, head * 5) * .85}/>
    </g>;
  });
  return shell(p, 'radial-cable-depth-tunnel', c[2], cables);
};

/** Reference: /backgrounds/light-pillar; volumetric vertical chromatic column, analytic ribbons. */
const LightPillar = (p: StyleBackdropProps): ReactElement => {
  const {colors: c, time, phase, strength, uid} = setup(p);
  const {width: w, height: h, style} = p;
  const ribbons = Array.from({length: 23}, (_, i) => {
    const orbit = i / 23 * TAU + phase;
    const seed = seeded(style.seed, i + 90);
    const edge = (u: number, side: number): Point => {
      const theta = orbit + u * (3 + seed * 2) - time * (.38 + strength * .45);
      const radius = w * (.035 + .065 * Math.sin(u * Math.PI) ** 2);
      const thickness = w * (.003 + .007 * seed) * (1.1 + .2 * Math.sin(u * 13 + time));
      return [w * .5 + Math.sin(theta) * radius + Math.sin(u * 8 + time * .3 + phase) * w * .017 + side * thickness, h * (u * 1.16 - .08)];
    };
    const d = line([...points(39, u => edge(u, -1)), ...points(39, u => edge(1 - u, 1))], true);
    return <path key={i} d={d} fill={`url(#${uid}-column)`} opacity={.14 + .16 * seed}/>;
  });
  const axis = line(points(42, u => [w * .5 + Math.sin(u * 9 - time * .5 + phase) * w * .015, h * u]));
  return shell(p, 'braided-volumetric-light-column', c[2], <>
    <defs><linearGradient id={`${uid}-column`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c[0]}/><stop offset=".55" stopColor={c[1]}/><stop offset="1" stopColor={c[0]}/></linearGradient></defs>
    <path d={axis} fill="none" stroke={c[0]} strokeWidth={w * .26} strokeOpacity=".026"/>
    <path d={axis} fill="none" stroke={c[1]} strokeWidth={w * .14} strokeOpacity=".045"/>
    {ribbons}<path d={axis} fill="none" stroke={c[1]} strokeWidth={w * .0025} strokeOpacity=".55"/>
  </>);
};

/** Reference: /backgrounds/floating-lines; separated top/middle/bottom travelling wave bundles. */
const FloatingLines = (p: StyleBackdropProps): ReactElement => {
  const {colors: c, time, phase, strength, uid} = setup(p);
  const {width: w, height: h, style} = p;
  const waves = Array.from({length: 36}, (_, i) => {
    const band = Math.floor(i / 12);
    const strand = i % 12;
    const seed = seeded(style.seed, band + 5);
    const amplitude = h * (.095 + strength * .045 + seed * .045);
    const d = line(points(61, u => [w * (u * 1.1 - .05), h * (.2 + band * .3) + (strand - 5.5) * h * .009
      + Math.sin(u * (4.3 + band * .8) + time * (.2 + band * .07 + strength * .16) + phase + band * 1.3) * amplitude
      + Math.sin(u * 8.6 - time * .17 + strand * .08 + phase) * h * .023]));
    return <path key={i} d={d} fill="none" stroke={`url(#${uid}-flow)`} strokeWidth={Math.max(.6, h * .0022)} strokeOpacity={.23 + (strand / 11) * .56}/>;
  });
  return shell(p, 'three-bundle-floating-sine-lines', c[2], <>
    <defs><linearGradient id={`${uid}-flow`}><stop offset="0" stopColor={c[0]} stopOpacity=".15"/><stop offset=".38" stopColor={c[0]}/><stop offset=".72" stopColor={c[1]}/><stop offset="1" stopColor={c[1]} stopOpacity=".15"/></linearGradient></defs>
    {waves}
  </>);
};

/** Reference: /backgrounds/grid-scan; perspective box-grid scanning, no webcam/gyro input. */
const GridScan = (p: StyleBackdropProps): ReactElement => {
  const {colors: c, time, phase, strength} = setup(p);
  const {width: w, height: h, style} = p;
  const vanish: Point = [w * (.5 + .045 * Math.sin(phase + time * .15)), h * (.48 + .04 * Math.cos(phase + time * .13))];
  const skew = (seeded(style.seed, 22) - .5) * .14;
  const corner = (x: number, y: number, depth: number): Point => [vanish[0] + (x * w * .8 + y * w * skew) * depth, vanish[1] + y * h * .86 * depth];
  const rectangle = (depth: number): string => line([corner(-1, -1, depth), corner(1, -1, depth), corner(1, 1, depth), corner(-1, 1, depth)], true);
  const boxes = Array.from({length: 19}, (_, i) => {
    const depth = .035 + (i / 18) ** 2 * 1.3;
    return <path key={i} d={rectangle(depth)} fill="none" stroke={c[0]} strokeWidth={Math.max(.5, w * .00085)} strokeOpacity={.14 + depth * .2}/>;
  });
  const rails: ReactElement[] = [];
  for (let i = -8; i <= 8; i++) for (const side of [-1, 1]) {
    rails.push(<path key={`h${i}-${side}`} d={line([vanish, corner(i / 8, side, 1.4)])} fill="none" stroke={c[0]} strokeOpacity=".28" strokeWidth="1"/>);
    rails.push(<path key={`v${i}-${side}`} d={line([vanish, corner(side, i / 8, 1.4)])} fill="none" stroke={c[0]} strokeOpacity=".23" strokeWidth="1"/>);
  }
  const scan = .035 + (.5 + .5 * Math.sin(time * (.65 + strength * .6) + phase)) ** 2 * 1.16;
  return shell(p, 'perspective-box-grid-scan', c[2], <>
    {boxes}{rails}
    <path d={rectangle(scan)} fill="none" stroke={c[1]} strokeWidth={Math.max(9, h * .04)} strokeOpacity=".045"/>
    <path d={rectangle(scan)} fill="none" stroke={c[1]} strokeWidth={Math.max(3, h * .009)} strokeOpacity=".16"/>
    <path d={rectangle(scan)} fill="none" stroke={c[1]} strokeWidth={Math.max(1, h * .0025)} strokeOpacity=".88"/>
  </>);
};

/** Reference: /backgrounds/prismatic-burst; rotating refracted ray facets, no raymarch copy. */
const PrismaticBurst = (p: StyleBackdropProps): ReactElement => {
  const {colors: c, time, phase, strength, uid} = setup(p);
  const {width: w, height: h, style} = p;
  const cx = w * (.5 + .05 * Math.sin(time * .19 + phase));
  const cy = h * (.5 + .065 * Math.cos(time * .23 + phase));
  const extent = Math.hypot(w, h) * .78;
  const rays = Array.from({length: 46}, (_, i) => {
    const seed = seeded(style.seed, i + 24);
    const angle = i / 46 * TAU + phase + time * (.075 + strength * .13);
    const spread = .013 + seed * .04;
    const bend = Math.sin(time * .41 + seed * TAU) * .17 * strength;
    const at = (radius: number, theta: number): Point => [cx + Math.cos(theta) * radius, cy + Math.sin(theta) * radius];
    const middle = extent * (.25 + seed * .23);
    const facet = line([at(5 + seed * 14, angle), at(middle, angle - spread), at(extent, angle + bend - spread * .7), at(extent, angle + bend + spread), at(middle, angle + spread * .6)], true);
    return <g key={i}>
      <path d={facet} fill={i % 2 ? c[0] : c[1]} opacity={.12 + seed * (.25 + strength * .2)}/>
      <path d={line([at(middle * .2, angle), at(middle, angle + spread * .3), at(extent, angle + bend)])} fill="none" stroke={i % 2 ? c[1] : c[0]} strokeWidth={Math.max(.5, w * .0007)} opacity=".5"/>
    </g>;
  });
  return shell(p, 'rotating-refracted-prism-fan', c[2], <>
    <defs><radialGradient id={`${uid}-center`}><stop offset="0" stopColor={c[1]} stopOpacity=".3"/><stop offset="1" stopColor={c[2]} stopOpacity="0"/></radialGradient></defs>
    {rays}<ellipse cx={cx} cy={cy} rx={w * .26} ry={h * .38} fill={`url(#${uid}-center)`}/>
  </>);
};

export const extendedEffectsB = {
  'circular-carousel': CircularCarousel,
  'micro-slats': MicroSlats,
  'ghost-fibers': GhostFibers,
  'acid-squares': AcidSquares,
  'light-tunnel': LightTunnel,
  'light-pillar': LightPillar,
  'floating-lines': FloatingLines,
  'grid-scan': GridScan,
  'prismatic-burst': PrismaticBurst,
} as const;
