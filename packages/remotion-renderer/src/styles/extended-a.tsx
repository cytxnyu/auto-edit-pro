import type {ReactElement, ReactNode} from 'react';
import {PALETTES} from '../../../core/src/palettes';
import type {StyleBackdropProps} from './index';

/** Original video implementations. Upstream links document visual mechanisms only;
 * no upstream source, images, pointer state or animation runtime is redistributed. */
export const extendedSourcesA = {
  'shape-waves': {page: 'https://reactbits.dev/backgrounds/shape-waves', source: 'https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/ShapeWaves/ShapeWaves.jsx', mechanism: 'Noise-banded square/circle/triangle cells and travelling charge waves; cellSize, dotSize, shapes, speed, flow, splashStrength.'},
  'ripple-distortion': {page: 'https://reactbits.dev/animations/ripple-distortion', source: 'https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/RippleDistortion/RippleDistortion.jsx', mechanism: 'Expanding displacement rings with swirl, dispersion and surface glints; brushSize, strength, rings, spread, fade. Here only an original abstract lattice is refracted.'},
  'evil-eye': {page: 'https://reactbits.dev/backgrounds/evil-eye', source: 'https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/EvilEye/EvilEye.jsx', mechanism: 'Polar noisy iris, flame fibres, elliptical glow and vertical pupil; pupilSize, irisWidth, glowIntensity, noiseScale, flameSpeed.'},
  'electric-border': {page: 'https://reactbits.dev/animations/electric-border', source: 'https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/ElectricBorder/ElectricBorder.jsx', mechanism: 'Noisy perimeter displacement and layered glow; color, speed, chaos, borderRadius. The central content area remains clear.'},
  lightning: {page: 'https://reactbits.dev/backgrounds/lightning', source: 'https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Lightning/Lightning.jsx', mechanism: 'Time-varying noisy lightning filament with strong distance falloff; hue, xOffset, speed, intensity, size.'},
  'grid-motion': {page: 'https://reactbits.dev/backgrounds/grid-motion', source: 'https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/GridMotion/GridMotion.jsx', mechanism: 'Four tilted card rows slide in alternating directions with differing lag; items, gradientColor. Here cards contain original abstract geometry.'},
  waves: {page: 'https://reactbits.dev/backgrounds/waves', source: 'https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Waves/Waves.jsx', mechanism: 'Dense vertical line points displaced by a smooth travelling field; waveSpeedX/Y, waveAmpX/Y, xGap, yGap, friction, tension.'},
  'metallic-paint': {page: 'https://reactbits.dev/animations/metallic-paint', source: 'https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/MetallicPaint/MetallicPaint.jsx', mechanism: 'Shape-constrained flowing reflective bands and contour highlights; seed, scale, refraction, liquid, brightness, fresnel, contour. Here the shapes are local abstract silhouettes only.'},
} as const;
export type ExtendedStyleAId = keyof typeof extendedSourcesA;

const TAU = Math.PI * 2;
const f = (n: number): string => n.toFixed(2);
const clamp = (n: number): number => Math.max(0, Math.min(1, n));
const mod = (n: number, size = 1): number => ((n % size) + size) % size;
const hash = (seed: number, index: number): number => {
  let n = Math.imul((seed ^ (index + 1357)) >>> 0, 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const palette = (p: StyleBackdropProps): [string, string, string] => {
  const source = PALETTES[p.style.id];
  return p.style.colors ?? [source.accent, source.line, source.canvas];
};
const clock = (p: StyleBackdropProps, speed = 1): number => p.frame / p.fps * speed * (.4 + .6 * clamp(p.style.intensity));
const pointsPath = (points: [number, number][], close = false): string => points.map(([x,y], i) => `${i ? 'L' : 'M'}${f(x)},${f(y)}`).join('') + (close ? 'Z' : '');
const canvas = (p: StyleBackdropProps, mechanism: string, children: ReactNode): ReactElement => <svg data-effect={mechanism} width={p.width} height={p.height} viewBox={`0 0 ${p.width} ${p.height}`} style={{display: 'block', overflow: 'hidden'}}>
  <rect width={p.width} height={p.height} fill={palette(p)[2]}/>{children}
</svg>;
const filterId = (p: StyleBackdropProps, suffix: string): string => `${p.style.id}-${p.style.seed}-${Math.round(p.width)}-${Math.round(p.height)}-${suffix}`;

const ShapeWaves = (p: StyleBackdropProps): ReactElement => {
  const colors = palette(p), t = clock(p, .9), phase = hash(p.style.seed, 1) * TAU;
  const cell = Math.max(17, p.width / 43), cells: ReactElement[] = [];
  for (let row = 0; row <= Math.ceil(p.height / cell); row++) for (let col = 0; col <= Math.ceil(p.width / cell); col++) {
    const x = col * cell, y = row * cell;
    const distance = Math.hypot(col - 15 - 5 * Math.sin(t * .35), row - 7 - 3 * Math.cos(t * .27));
    const field = Math.sin(distance * .49 - t * 1.4 + phase) * .62 + Math.cos(col * .24 + row * .19 + t * .56) * .38;
    const radius = cell * (.14 + .22 * (field + 1) / 2);
    const shape = Math.floor(hash(p.style.seed, row * 100 + col) * 3);
    const fill = field > .15 ? colors[0] : colors[1];
    const rotate = field * 24;
    const transform = `translate(${f(x + Math.sin(t + row * .3) * cell * .07)},${f(y)}) rotate(${f(rotate)})`;
    cells.push(<g key={`${row}:${col}`} transform={transform} opacity={.3 + (field + 1) * .32}>
      {shape === 0 ? <rect x={-radius} y={-radius} width={radius * 2} height={radius * 2} fill={fill}/> : shape === 1 ? <circle r={radius} fill={fill}/> : <path d={`M0,${f(-radius * 1.3)}L${f(radius * 1.2)},${f(radius)}L${f(-radius * 1.2)},${f(radius)}Z`} fill={fill}/>}
    </g>);
  }
  return canvas(p, 'mixed-shape-charge-field', cells);
};

const RippleDistortion = (p: StyleBackdropProps): ReactElement => {
  const colors = palette(p), t = clock(p, .8);
  const centres = [0,1,2].map(i => ({x: p.width * (.2 + hash(p.style.seed, i * 3) * .6), y: p.height * (.2 + hash(p.style.seed, i * 3 + 1) * .6), offset: hash(p.style.seed, i * 3 + 2) * 4}));
  const displaced = (x: number, y: number): [number, number] => {
    let dx = 0, dy = 0;
    for (const centre of centres) {
      const ax = x - centre.x, ay = y - centre.y, radius = Math.max(1, Math.hypot(ax, ay));
      const envelope = Math.exp(-radius / (p.height * .68));
      const wave = Math.sin(radius / p.height * 36 - t * 3 + centre.offset) * envelope * p.height * (.011 + .017 * p.style.intensity);
      dx += (ax / radius - ay / radius * .3) * wave;
      dy += (ay / radius + ax / radius * .3) * wave;
    }
    return [x + dx, y + dy];
  };
  const lines: ReactElement[] = [];
  for (let row = -2; row < 32; row++) {
    const points = Array.from({length: 100}, (_, i) => displaced(i / 99 * p.width, row / 29 * p.height));
    lines.push(<path key={`h${row}`} d={pointsPath(points)} fill="none" stroke={row % 3 ? colors[1] : colors[0]} strokeWidth={row % 3 ? 1.2 : 3.4} opacity={row % 3 ? .35 : .75}/>);
  }
  for (let col = -2; col < 46; col++) {
    const points = Array.from({length: 76}, (_, i) => displaced(col / 43 * p.width, i / 75 * p.height));
    lines.push(<path key={`v${col}`} d={pointsPath(points)} fill="none" stroke={colors[0]} strokeWidth="1.2" opacity=".28"/>);
  }
  const rings = centres.flatMap((centre, ci) => [0,1,2].map(ri => {
    const amount = mod(t * .18 + ri / 3 + ci * .21);
    return <ellipse key={`${ci}:${ri}`} cx={centre.x} cy={centre.y} rx={amount * p.height * .8 + 1} ry={amount * p.height * .55 + 1} fill="none" stroke={colors[0]} strokeWidth="1.3" opacity={(1 - amount) * .3}/>;
  }));
  return canvas(p, 'abstract-lattice-radial-refraction', <g data-abstract-surface="true">{lines}{rings}</g>);
};

const EvilEye = (p: StyleBackdropProps): ReactElement => {
  const colors = palette(p), t = clock(p, .6), unit = Math.min(p.width * .43, p.height * .47);
  const cx = p.width * .5, cy = p.height * .5, phase = hash(p.style.seed, 3) * TAU;
  const id = filterId(p, 'iris');
  const fibres = Array.from({length: 190}, (_, i) => {
    const angle = i / 190 * TAU;
    const variation = hash(p.style.seed, i + 11);
    const points = Array.from({length: 22}, (_, j): [number, number] => {
      const v = j / 21, r = unit * (.25 + v * (.52 + variation * .18));
      const a = angle + Math.sin(v * 9 + t * 2 + variation * 8) * .06 * v + Math.sin(v * 3 - t + phase) * .05;
      const flicker = 1 + Math.sin(t * 2.3 + i * .77 + v * 10) * .055 * v;
      return [cx + Math.cos(a) * r * flicker * 1.5, cy + Math.sin(a) * r * flicker];
    });
    return <path key={i} d={pointsPath(points)} fill="none" stroke={i % 5 ? colors[0] : colors[1]} strokeWidth={.6 + variation * 1.65} opacity={.25 + variation * .6}/>;
  });
  const pupilX = cx + Math.sin(t * .8 + phase) * unit * .03;
  const pupilWidth = unit * (.065 + .009 * Math.sin(t * 1.3 + phase));
  return canvas(p, 'flame-iris-and-slit-pupil', <>
    <defs><radialGradient id={id}><stop offset="0" stopColor={colors[2]}/><stop offset=".28" stopColor={colors[1]} stopOpacity=".4"/><stop offset=".52" stopColor={colors[0]} stopOpacity=".4"/><stop offset="1" stopColor={colors[2]} stopOpacity="0"/></radialGradient></defs>
    <ellipse cx={cx} cy={cy} rx={unit * 1.75} ry={unit * 1.08} fill={`url(#${id})`}/>{fibres}
    <path d={`M${f(pupilX)},${f(cy - unit * .53)}Q${f(pupilX + pupilWidth)},${f(cy)} ${f(pupilX)},${f(cy + unit * .53)}Q${f(pupilX - pupilWidth)},${f(cy)} ${f(pupilX)},${f(cy - unit * .53)}Z`} fill={colors[2]} stroke={colors[1]} strokeOpacity=".36" strokeWidth="1.3"/>
  </>);
};

const ElectricBorder = (p: StyleBackdropProps): ReactElement => {
  const colors = palette(p), t = clock(p, 1.3), pad = Math.min(p.width, p.height) * .04, id = filterId(p, 'glow');
  const width = p.width - 2 * pad, height = p.height - 2 * pad, perimeter = (width + height) * 2;
  const path = (layer: number): string => pointsPath(Array.from({length: 560}, (_, i): [number, number] => {
    const distance = i / 559 * perimeter;
    let x: number, y: number, nx = 0, ny = 0;
    if (distance <= width) {x = pad + distance; y = pad; ny = 1;}
    else if (distance <= width + height) {x = pad + width; y = pad + distance - width; nx = -1;}
    else if (distance <= width * 2 + height) {x = pad + width * 2 + height - distance; y = pad + height; ny = -1;}
    else {x = pad; y = pad + perimeter - distance; nx = 1;}
    const phase = hash(p.style.seed, i % 29 + layer * 41) * TAU;
    const jitter = (Math.sin(i * 2.17 + t * 3 + phase) + .45 * Math.sin(i * .77 - t * 5 + layer)) * Math.min(p.width, p.height) * (.006 + .01 * p.style.intensity);
    return [x + nx * jitter, y + ny * jitter];
  }), true);
  const arcs = [path(0), path(1)];
  return canvas(p, 'perimeter-electric-arcs', <g data-effect-region="perimeter">
    <defs><filter id={id} x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="6"/></filter></defs>
    {arcs.map((d,i) => <path key={`glow${i}`} d={d} fill="none" stroke={colors[i]} strokeWidth="9" opacity=".45" filter={`url(#${id})`}/>)}
    {arcs.map((d,i) => <path key={i} data-perimeter-path="true" d={d} fill="none" stroke={colors[i]} strokeWidth={i ? 1.1 : 2.1} opacity={i ? .6 : 1} strokeLinejoin="round"/>)}
  </g>);
};

const Lightning = (p: StyleBackdropProps): ReactElement => {
  const colors = palette(p), t = clock(p, 1.4), id = filterId(p, 'bolt');
  const mainX = p.width * (.45 + hash(p.style.seed, 1) * .15);
  const main = Array.from({length: 55}, (_, i): [number, number] => {
    const y = i / 54 * p.height;
    const phase = hash(p.style.seed, i + 2) * TAU;
    const jag = Math.sin(i * 1.71 + t * 2 + phase) * .48 + Math.sin(i * .34 - t * .7) * .52;
    return [mainX + jag * p.width * (.035 + p.style.intensity * .05), y];
  });
  const branches = [10,19,28,38].map((start, bi) => {
    const sign = bi % 2 ? -1 : 1, origin = main[start];
    return pointsPath(Array.from({length: 17}, (_, j): [number, number] => [origin[0] + sign * j / 16 * p.width * (.11 + hash(p.style.seed, bi + 91) * .09) + Math.sin(j * 2.3 + t * 2 + bi) * p.width * .009, origin[1] + j / 16 * p.height * .18]));
  });
  const d = pointsPath(main);
  return canvas(p, 'branching-lightning-filament', <>
    <defs><filter id={id} x="-100%" y="-10%" width="300%" height="120%"><feGaussianBlur stdDeviation="11"/></filter></defs>
    <path d={d} fill="none" stroke={colors[1]} strokeWidth="34" opacity=".35" filter={`url(#${id})`}/>
    {branches.map((branch,i) => <path key={i} d={branch} fill="none" stroke={colors[1]} strokeWidth="1.5" opacity=".6"/>)}
    <path d={d} fill="none" stroke={colors[1]} strokeWidth="8" opacity=".55"/>
    <path d={d} fill="none" stroke={colors[0]} strokeWidth="2.3"/>
  </>);
};

const GridMotion = (p: StyleBackdropProps): ReactElement => {
  const colors = palette(p), t = clock(p, .45), gap = p.width * .012, cellW = p.width * .22, cellH = p.height * .33;
  const rows = Array.from({length: 5}, (_, row) => {
    const offset = Math.sin(t * (.75 + row * .07) + hash(p.style.seed, row) * 2) * cellW * (row % 2 ? -1 : 1);
    return <g key={row} transform={`translate(${f(-p.width * .3 + offset)},${f((row - .6) * (cellH + gap))})`}>
      {Array.from({length: 8}, (_, col) => {
        const id = row * 8 + col, shape = Math.floor(hash(p.style.seed, id + 30) * 3);
        const accent = id % 3 ? colors[1] : colors[0];
        return <g key={col} transform={`translate(${f(col * (cellW + gap))},0)`}>
          <rect width={cellW} height={cellH} rx="8" fill={colors[2]} stroke={accent} strokeWidth="1"/>
          {shape === 0 ? <><circle cx={cellW * .5} cy={cellH * .5} r={cellH * .28} fill="none" stroke={accent} strokeWidth={cellH * .11}/><circle cx={cellW * .5} cy={cellH * .5} r={cellH * .09} fill={colors[0]}/></> : shape === 1 ? <g fill={accent}>{[0,1,2,3].map(i => <rect key={i} x={cellW * (.13 + i * .2)} y={cellH * .2} width={cellW * .11} height={cellH * .6} transform={`rotate(18 ${cellW * .5} ${cellH * .5})`} opacity={.3 + i * .16}/>)}</g> : <path d={`M${cellW * .14},${cellH * .72}L${cellW * .5},${cellH * .15}L${cellW * .86},${cellH * .72}Z`} fill={accent} opacity=".65"/>}
        </g>;
      })}
    </g>;
  });
  return canvas(p, 'tilted-countermoving-tile-rows', <g data-abstract-surface="true" transform={`rotate(-13 ${p.width / 2} ${p.height / 2})`}>{rows}</g>);
};

const Waves = (p: StyleBackdropProps): ReactElement => {
  const colors = palette(p), t = clock(p, .75), phase = hash(p.style.seed, 9) * TAU;
  const count = 86;
  return canvas(p, 'flowing-vertical-line-contours', Array.from({length: count}, (_, line) => {
    const points = Array.from({length: 86}, (_, i): [number, number] => {
      const x = (line - 4) / (count - 9) * p.width, y = i / 85 * p.height;
      const wave = Math.sin(y / p.height * 8 + line * .067 - t + phase) + .48 * Math.sin(y / p.height * 15 - line * .08 + t * .67);
      return [x + wave * p.width * (.012 + .025 * p.style.intensity), y + Math.cos(line * .11 + t + phase) * p.height * .01];
    });
    return <path key={line} d={pointsPath(points)} fill="none" stroke={line % 13 === 0 ? colors[1] : colors[0]} strokeWidth={line % 13 === 0 ? 2.2 : 1.2} opacity={line % 13 === 0 ? .85 : .5}/>;
  }));
};

const MetallicPaint = (p: StyleBackdropProps): ReactElement => {
  const colors = palette(p), t = clock(p, .55), id = filterId(p, 'chrome');
  const phase = hash(p.style.seed, 22) * TAU;
  const forms = [0,1,2].map(form => {
    const cx = p.width * (.16 + form * .34), cy = p.height * (.48 + Math.sin(form * 2 + phase) * .12);
    const unit = Math.min(p.width * .25, p.height * .52);
    const contour = (scale: number, shift = 0): string => pointsPath(Array.from({length: 128}, (_, i): [number, number] => {
      const angle = i / 128 * TAU;
      const radius = unit * scale * (1 + .2 * Math.cos(angle * 3 + t * .7 + phase + form) + .08 * Math.sin(angle * 5 - t + form));
      return [cx + Math.cos(angle + shift) * radius, cy + Math.sin(angle + shift) * radius * .82];
    }), true);
    return <g key={form} data-abstract-metal-form={form}>
      <path d={contour(1)} fill={`url(#${id}-${form})`} stroke={colors[1]} strokeWidth="1.3"/>
      {[.83,.65,.43].map((scale,i) => <path key={scale} d={contour(scale, .025 * Math.sin(t + i))} fill="none" stroke={i % 2 ? colors[2] : colors[0]} strokeWidth={i % 2 ? unit * .022 : unit * .012} opacity={i % 2 ? .6 : .4}/>)}
    </g>;
  });
  return canvas(p, 'liquid-chrome-abstract-silhouettes', <g data-abstract-surface="true">
    <defs>{[0,1,2].map(form => <linearGradient key={form} id={`${id}-${form}`} x1="0" y1="0" x2="1" y2="1" gradientTransform={`rotate(${f(15 + Math.sin(t * .45 + phase + form) * 18)} .5 .5)`}>
      {[0,.13,.2,.24,.34,.48,.54,.61,.7,.84,1].map((offset,i) => <stop key={offset} offset={offset} stopColor={[colors[2],colors[1],colors[0],colors[2],colors[1],colors[0],colors[2],colors[0],colors[1],colors[2],colors[0]][i]}/>)}
    </linearGradient>)}</defs>{forms}
  </g>);
};

export const extendedEffectsA = {
  'shape-waves': ShapeWaves,
  'ripple-distortion': RippleDistortion,
  'evil-eye': EvilEye,
  'electric-border': ElectricBorder,
  lightning: Lightning,
  'grid-motion': GridMotion,
  waves: Waves,
  'metallic-paint': MetallicPaint,
} satisfies Record<ExtendedStyleAId, (props: StyleBackdropProps) => ReactElement>;
