import {catalogBackgroundEffects} from './catalog-backgrounds';
import {catalogAnimationEffects} from './catalog-animations';
import {catalogComponentEffects} from './catalog-components';
import {catalogMaterials,catalogDefaults} from './catalog-materials';
import type {CSSProperties, ReactElement} from 'react';
import type {VisualStyle, VisualStyleId} from '../../../core/src/visual-styles';
import {extendedEffectsA} from './extended-a';
import {extendedEffectsB} from './extended-b';
import {extendedDefaults, extendedMaterials} from './extended-materials';

/** Original, frame-addressable video effects inspired by the linked visual mechanisms.
 * No browser clock, pointer simulation, external assets or upstream component code. */
export type {VisualStyleId};
export type VisualStyleSpec = VisualStyle;
export type StyleBackdropProps = {style: VisualStyleSpec; frame: number; fps: number; width: number; height: number};
const clamp = (n: number): number => Math.max(0, Math.min(1, n));
const fixed = (n: number): string => n.toFixed(2);
const modulo = (n: number, d = 1): number => ((n % d) + d) % d;
const noise = (seed: number, n: number): number => {
  let x = (seed ^ Math.imul(n + 1, 0x45d9f3b)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const defaults: Record<VisualStyleId, [string, string, string]> = {
  ...extendedDefaults, ...catalogDefaults,
  balatro: ['#e5654b', '#246fa2', '#101a22'],
  'crt-warp': ['#9effbb', '#5eddaa', '#050d0a'],
  cubes: ['#f5e6c8', '#ff9a45', '#191b1f'],
  hyperspeed: ['#f459be', '#67e6ff', '#070b18'],
};

export type StyleMaterial = {
  radius: number; fontFamily: string; surface: string; line: string; accent: string;
  shadow: string; letterSpacing: string; borderWidth: number;
};
const materials: Record<VisualStyleId, StyleMaterial> = {
  ...extendedMaterials, ...catalogMaterials,
  balatro: {radius: 18, fontFamily: '"Microsoft YaHei", Inter, sans-serif', surface: '#101a22', line: '#f3baa8', accent: '#e5654b', shadow: '0 18px 60px #00000066, inset 0 1px 0 #ffffff33', letterSpacing: '-0.025em', borderWidth: 1},
  'crt-warp': {radius: 2, fontFamily: '"Cascadia Code", Consolas, "Microsoft YaHei", monospace', surface: '#050d0a', line: '#5eddaa', accent: '#9effbb', shadow: '0 0 28px #9effbb24, inset 0 0 28px #9effbb0b', letterSpacing: '0.025em', borderWidth: 1},
  cubes: {radius: 0, fontFamily: '"Microsoft YaHei", Arial, sans-serif', surface: '#191b1f', line: '#f5e6c8', accent: '#ff9a45', shadow: '10px 10px 0 #191b1f', letterSpacing: '-0.04em', borderWidth: 2},
  hyperspeed: {radius: 4, fontFamily: 'Inter, "Microsoft YaHei", sans-serif', surface: '#070b18', line: '#67e6ff', accent: '#f459be', shadow: '0 8px 36px #00000088', letterSpacing: '-0.035em', borderWidth: 1},
};
export const styleMaterial = (id: VisualStyleId): StyleMaterial => materials[id];

/** The field is quantized into horizontal runs rather than per-pixel DOM nodes. */
const fieldPaths = (cols: number, rows: number, sample: (x: number, y: number) => number, levels: number): string[] => {
  const paths = Array.from({length: levels}, () => '');
  for (let row = 0; row < rows; row++) {
    let start = 0;
    let last = sample(0, row);
    for (let col = 1; col <= cols; col++) {
      const color = col < cols ? sample(col, row) : -1;
      if (color !== last) {
        paths[last] += `M${start},${row}h${col - start}v1h-${col - start}z`;
        start = col;
        last = color;
      }
    }
  }
  return paths;
};

const BalatroField = ({style, frame, fps, width, height}: StyleBackdropProps): ReactElement => {
  const colors = style.colors ?? defaults.balatro;
  const cols = 512;
  const rows = Math.max(48, Math.round(cols * height / width));
  const t = frame / fps * (0.23 + clamp(style.intensity) * 0.45);
  const seedPhase = noise(style.seed, 2) * Math.PI * 2;
  const paths = fieldPaths(cols, rows, (col, row) => {
    const u = (col / cols - .5) * 2 * width / height;
    const v = (row / rows - .5) * 2;
    const radius = Math.hypot(u, v);
    const angle = Math.atan2(v, u) + 1.4 * radius + t * .45 + seedPhase;
    let x = Math.cos(angle) * radius;
    let y = Math.sin(angle) * radius;
    // Four smooth domain-warp passes create curling paint rivers, not concentric rings.
    for (let k = 0; k < 4; k++) {
      const oldX = x;
      x += .38 * Math.sin(y * (2.1 + k * .2) + t + k * 1.7);
      y += .34 * Math.cos(oldX * (2.7 - k * .18) - t * .72 + k * 2.1);
    }
    const ink = Math.sin(4.3 * x + 2.2 * Math.sin(y * 2.4 + t)) + .45 * Math.cos(y * 5.2 - t * .6);
    return ink < -.28 ? 0 : ink < .5 ? 2 : 1;
  }, 3);
  return <svg data-effect="liquid-marble" viewBox={`0 0 ${cols} ${rows}`} width={width} height={height} preserveAspectRatio="none" style={{display: 'block'}}>
    <rect width={cols} height={rows} fill={colors[2]}/>
    {paths.map((d, i) => <path key={i} d={d} fill={colors[i]}/>)}
  </svg>;
};

const CrtField = ({style, frame, fps, width, height}: StyleBackdropProps): ReactElement => {
  const colors = style.colors ?? defaults['crt-warp'];
  const cols = 116;
  const rows = 58;
  const t = frame / fps * (.36 + clamp(style.intensity) * .48) + noise(style.seed, 4) * 6;
  const id = `crt-${style.seed}-${Math.round(width)}-${Math.round(height)}`;
  const paths = fieldPaths(cols, rows, (col, row) => {
    const u = (col / cols - .5) * 2;
    const v = (row / rows - .5) * 2;
    const x = u * (1 + .19 * v * v);
    const y = v * (1 + .19 * u * u);
    const plasma = Math.sin(x * 4.8 + Math.cos(t)) + Math.sin(y * 6.2 - t * .65)
      + .8 * Math.sin(x * 2.7 + y * 3.8 + t) + .5 * Math.cos(Math.hypot(x + .4 * Math.sin(t), y) * 9 - t);
    return Math.min(3, Math.max(0, Math.floor((plasma + 3.3) / 1.66)));
  }, 4);
  return <svg data-effect="curved-phosphor-raster" viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{display: 'block'}}>
    <defs>
      <pattern id={`${id}-lines`} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.6" fill="#000" opacity=".6"/></pattern>
      <radialGradient id={`${id}-shade`}><stop offset="35%" stopColor="#000" stopOpacity="0"/><stop offset="100%" stopColor="#000" stopOpacity=".88"/></radialGradient>
      <clipPath id={`${id}-tube`}><path d={`M${width * .07},${height * .065} Q${width * .5},${-height * .055} ${width * .93},${height * .065} Q${width * 1.05},${height * .5} ${width * .93},${height * .935} Q${width * .5},${height * 1.055} ${width * .07},${height * .935} Q${-width * .05},${height * .5} ${width * .07},${height * .065}Z`}/></clipPath>
    </defs>
    <rect width={width} height={height} fill={colors[2]}/>
    <g clipPath={`url(#${id}-tube)`}>
      <g transform={`scale(${width / cols} ${height / rows})`}>
        {paths.map((d, i) => <path key={i} d={d} fill={i === 0 ? colors[2] : colors[0]} opacity={[1, .16, .38, .76][i]}/>)}
      </g>
      <rect width={width} height={height} fill={`url(#${id}-lines)`}/>
      <rect x="0" y={modulo(frame / fps * .09) * height} width={width} height={height * .012} fill={colors[1]} opacity=".14"/>
      <rect width={width} height={height} fill={`url(#${id}-shade)`}/>
    </g>
    <rect x={width * .033} y={height * .026} width={width * .934} height={height * .948} rx={height * .09} fill="none" stroke={colors[0]} strokeOpacity=".25" strokeWidth="2"/>
  </svg>;
};

/** Isometric rigid faces rise in a travelling wave; view order remains deterministic. */
export const CubesField = ({style, frame, fps, width, height}: StyleBackdropProps): ReactElement => {
  const colors = style.colors ?? defaults.cubes;
  const t = frame / fps * (.55 + style.intensity * .5);
  const unit = Math.max(width / 17, height / 11);
  const items: ReactElement[] = [];
  for (let row = -6; row <= 9; row++) {
    for (let col = -8; col <= 10; col++) {
      const x = width * .5 + (col - row) * unit * .87;
      const y = height * .26 + (col + row) * unit * .45;
      if (x < -unit || x > width + unit || y < -unit * 3 || y > height + unit * 2) continue;
      const phase = Math.hypot(col - 2.4 * Math.sin(t * .36), row - 2.4 * Math.cos(t * .26)) * .8 - t * 2.2 + noise(style.seed, 1) * 6;
      const pulse = (Math.sin(phase) + 1) * .5;
      const lift = unit * (.12 + pulse * .72);
      const top = y - lift;
      const w = unit * .79;
      const h = unit * .405;
      const face = pulse > .87 ? colors[1] : colors[0];
      items.push(<g key={`${row}-${col}`} data-cube={`${row}:${col}`} stroke={colors[2]} strokeWidth={Math.max(1, unit * .017)} strokeLinejoin="round">
        <path d={`M${x - w},${top}L${x},${top + h}L${x},${y + h + unit * .55}L${x - w},${y + unit * .55}Z`} fill={face}/>
        <path d={`M${x},${top + h}L${x + w},${top}L${x + w},${y + unit * .55}L${x},${y + h + unit * .55}Z`} fill={colors[2]}/>
        <path d={`M${x},${top - h}L${x + w},${top}L${x},${top + h}L${x - w},${top}Z`} fill={face}/>
        <path d={`M${x},${top - h}L${x + w},${top}L${x},${top + h}`} fill="none" stroke="#ffffff" strokeOpacity=".44"/>
      </g>);
    }
  }
  return <svg data-effect="isometric-wave-assembly" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block'}}>
    <rect width={width} height={height} fill={colors[2]}/>{items}
  </svg>;
};

const HyperspeedField = ({style, frame, fps, width, height}: StyleBackdropProps): ReactElement => {
  const colors = style.colors ?? defaults.hyperspeed;
  const t = frame / fps * (.35 + style.intensity * .85);
  const id = `speed-${style.seed}-${Math.round(width)}-${Math.round(height)}`;
  const point = (lane: number, depth: number, elevation = 0): [number, number] => {
    const d = Math.max(0, depth);
    const bend = Math.sin(d * 2.2 + t * .35) * width * .065 * d * d;
    return [width * .5 + lane * width * .5 * d + bend, height * .33 + height * .88 * d * d - elevation * height * d];
  };
  const path = (lane: number, start: number, end: number, elevation = 0): string => {
    const pts = Array.from({length: 14}, (_, i) => point(lane, start + (end - start) * i / 13, elevation));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${fixed(p[0])},${fixed(p[1])}`).join('');
  };
  const streaks = Array.from({length: 78}, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const depth = .08 + modulo(noise(style.seed, i + 7) + t * (.34 + noise(style.seed, i + 131) * .4)) * 1.18;
    const lane = side * (.13 + noise(style.seed, i + 45) * 1.32);
    const length = .035 + depth * .115;
    const color = side < 0 ? colors[0] : colors[1];
    return <path key={i} d={path(lane, Math.max(.04, depth - length), depth, i % 7 === 0 ? .12 : 0)} fill="none" stroke={color} strokeWidth={.8 + depth * 3.4} opacity={clamp(depth * 1.5)} strokeLinecap="round"/>;
  });
  return <svg data-effect="perspective-speed-road" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block'}}>
    <defs><filter id={`${id}-glow`} x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
      <radialGradient id={`${id}-haze`}><stop stopColor={colors[0]} stopOpacity=".25"/><stop offset="100%" stopColor={colors[2]} stopOpacity="0"/></radialGradient></defs>
    <rect width={width} height={height} fill={colors[2]}/>
    <ellipse cx={width * .5} cy={height * .34} rx={width * .42} ry={height * .48} fill={`url(#${id}-haze)`}/>
    {[-1.8, -1.25, -.95, -.22, .22, .95, 1.25, 1.8].map((lane, i) => <path key={lane} d={path(lane, .015, 1.4)} fill="none" stroke={i < 4 ? colors[0] : colors[1]} strokeWidth={i % 2 ? 2 : 1} opacity={i % 2 ? .45 : .2}/>)}
    <g filter={`url(#${id}-glow)`} opacity=".55">{streaks}</g><g>{streaks}</g>
    {Array.from({length: 16}, (_, i) => {
      const d = .08 + modulo(i / 16 + t * .4) * 1.2;
      return [-1, 1].map(side => {const [x,y] = point(side * 1.48,d); return <path key={`${i}:${side}`} d={`M${x},${y}v${-d * height * .15}`} stroke={colors[1]} strokeWidth={1 + d * 3} opacity={clamp(d * .8)}/>;});
    })}
  </svg>;
};

const effects: Record<VisualStyleId, (props: StyleBackdropProps) => ReactElement> = {
  balatro: BalatroField, 'crt-warp': CrtField, cubes: CubesField, hyperspeed: HyperspeedField,
  ...extendedEffectsA, ...extendedEffectsB,
  ...catalogBackgroundEffects, ...catalogAnimationEffects, ...catalogComponentEffects,
};
export const REGISTERED_STYLE_IDS = Object.keys(effects) as VisualStyleId[];
export const StyleBackdrop = (props: StyleBackdropProps): ReactElement => {
  const Effect = effects[props.style.id];
  const colors = props.style.colors ?? defaults[props.style.id];
  const effectOpacity = .25 + .75 * clamp(props.style.intensity);
  const container: CSSProperties = {position: 'absolute', inset: 0, width: props.width, height: props.height, overflow: 'hidden', pointerEvents: 'none', background: colors[2]};
  return <div aria-hidden data-visual-effect={props.style.id} data-effect-frame={props.frame} data-effect-seed={props.style.seed} style={container}>
    <div data-effect-intensity={props.style.intensity} style={{position: 'absolute', inset: 0, opacity: effectOpacity}}><Effect {...props}/></div>
  </div>;
};
