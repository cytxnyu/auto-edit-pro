import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {PALETTES} from '../../core/src/palettes';
import {extendedEffectsB} from '../src/styles/extended-b';
import type {StyleBackdropProps} from '../src/styles';

const ids = ['circular-carousel', 'micro-slats', 'ghost-fibers', 'acid-squares', 'light-tunnel', 'light-pillar', 'floating-lines', 'grid-scan', 'prismatic-burst'] as const;
type Id = typeof ids[number];
const markup = (id: Id, frame: number, seed = 901, colors?: [string, string, string], intensity = .65): string => {
  const Effect = extendedEffectsB[id];
  const props: StyleBackdropProps = {style: {id, seed, intensity, colors}, frame, fps: 30, width: 1280, height: 720};
  return renderToStaticMarkup(<Effect {...props}/>);
};
// Compare actual vector positions, not metadata, paint color, alpha, IDs or a progress counter.
const geometry = (html: string): string[] => html.match(/\s(?:d|points|x|y|x1|y1|x2|y2|cx|cy|rx|ry|transform)="[^"]*"/g) ?? [];

describe('nine original deterministic extended style B mechanisms', () => {
  it('registers the exact nine assigned IDs and no substitutes', () => {
    expect(Object.keys(extendedEffectsB).sort()).toEqual([...ids].sort());
  });
  it.each(ids)('%s changes real vector geometry with the addressed frame', id => {
    const early = markup(id, 13);
    const later = markup(id, 71);
    expect(early).toContain('<svg');
    expect(early).toContain('<path');
    expect(geometry(early).length).toBeGreaterThan(2);
    expect(geometry(early)).not.toEqual(geometry(later));
    expect(early).not.toMatch(/NaN|Infinity/);
  });
  it.each(ids)('%s is independent of prior seek order and has geometric seed variation', id => {
    const expected = markup(id, 43);
    for (const frame of [100, 0, 17, 80, 5]) markup(id, frame);
    expect(markup(id, 43)).toBe(expected);
    expect(geometry(markup(id, 43, 18731))).not.toEqual(geometry(expected));
  });
  it.each(ids)('%s uses all supplied colors and the palette defaults', id => {
    const colors: [string, string, string] = ['#ac1349', '#38cb71', '#120938'];
    const painted = markup(id, 27, 901, colors);
    for (const color of colors) expect(painted).toContain(color);
    const defaults = markup(id, 27);
    for (const color of [PALETTES[id].accent, PALETTES[id].line, PALETTES[id].canvas]) expect(defaults).toContain(color);
  });
  it.each(ids)('%s intensity controls its geometry rather than only opacity', id => {
    expect(geometry(markup(id, 53, 901, undefined, 0))).not.toEqual(geometry(markup(id, 53, 901, undefined, 1)));
  });
  it('has nine distinct named visual mechanisms and no fabricated content/media', () => {
    const output = ids.map(id => markup(id, 41));
    const mechanisms = output.map(html => /data-effect="([^"]+)"/.exec(html)?.[1]);
    expect(new Set(mechanisms).size).toBe(9);
    for (const html of output) expect(html).not.toMatch(/<(?:text|img|image|video|audio)\b|(?:href|src)="https?:/);
  });
  it('has no autonomous clocks, device input or unseeded RNG', () => {
    const source = readFileSync(new URL('../src/styles/extended-b.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/Math\.random|Date\.now|performance\.now|requestAnimationFrame|setInterval|setTimeout|@keyframes|getUserMedia|addEventListener/);
  });
});
