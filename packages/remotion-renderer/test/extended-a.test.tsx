import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {PALETTES} from '../../core/src/palettes';
import {extendedEffectsA, extendedSourcesA, type ExtendedStyleAId} from '../src/styles/extended-a';

const ids: ExtendedStyleAId[] = ['shape-waves', 'ripple-distortion', 'evil-eye', 'electric-border', 'lightning', 'grid-motion', 'waves', 'metallic-paint'];
const render = (id: ExtendedStyleAId, frame = 30, seed = 2309, colors?: [string,string,string], intensity = .75) => {
  const Effect = extendedEffectsA[id];
  return renderToStaticMarkup(<Effect style={{id,seed,intensity,colors}} frame={frame} fps={30} width={1280} height={720}/>);
};
// Ignore colour/opacity/filter IDs/metadata: changing those alone is not motion.
const geometry = (html: string): string => Array.from(html.matchAll(/\s(d|points|x|y|cx|cy|r|rx|ry|width|height|transform|gradientTransform)="([^"]*)"/g)).map(match => `${match[1]}=${match[2]}`).join('|');

describe('extended style group A original frame effects', () => {
  it('exports exactly eight requested identifiers with eight distinct mechanisms', () => {
    expect(Object.keys(extendedEffectsA)).toEqual(ids);
    expect(new Set(ids.map(id => render(id).match(/data-effect="([^"]+)"/)?.[1])).size).toBe(8);
  });
  it.each(ids)('%s moves actual geometry between frames, not only opacity or metadata', id => {
    expect(geometry(render(id, 12))).not.toBe(geometry(render(id, 49)));
    expect(render(id)).toContain('<svg');
    expect(render(id)).not.toMatch(/NaN|Infinity/);
  });
  it.each(ids)('%s returns the identical frame after nonsequential seeks', id => {
    const first = render(id, 34);
    for (const frame of [92, 0, 13, 178, 1]) render(id, frame);
    expect(render(id, 34)).toBe(first);
  });
  it.each(ids)('%s seed changes geometry rather than just element IDs', id => {
    expect(geometry(render(id, 29, 1))).not.toBe(geometry(render(id, 29, 65535)));
  });
  it.each(ids)('%s supports all three custom colours and shared palette defaults', id => {
    const custom = render(id, 30, 2309, ['#aa1122','#33bb44','#5566cc']);
    for (const color of ['#aa1122','#33bb44','#5566cc']) expect(custom).toContain(color);
    const defaultHtml = render(id);
    for (const color of [PALETTES[id].accent, PALETTES[id].line, PALETTES[id].canvas]) expect(defaultHtml).toContain(color);
  });
  it.each(ids)('%s intensity influences frame-derived geometry', id => {
    expect(geometry(render(id, 43, 2309, undefined, .2))).not.toBe(geometry(render(id, 43, 2309, undefined, .9)));
  });
  it('keeps every electric arc vertex inside the outer ten-percent perimeter band', () => {
    const html = render('electric-border');
    const paths = Array.from(html.matchAll(/<path(?=[^>]*data-perimeter-path="true")[^>]*\sd="([^"]+)"/g));
    expect(paths).toHaveLength(2);
    for (const match of paths) for (const vertex of match[1].matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)) {
      const x = Number(vertex[1]), y = Number(vertex[2]);
      expect(x <= 128 || x >= 1152 || y <= 72 || y >= 648).toBe(true);
    }
  });
  it.each(['ripple-distortion', 'metallic-paint'] as const)('%s operates on local abstract surfaces, not source media', id => {
    const html = render(id);
    expect(html).toContain('data-abstract-surface="true"');
    expect(html).not.toMatch(/<image|<video|<img|href=|src=/);
  });
  it('records verified upstream reference paths without loading upstream runtimes', () => {
    for (const id of ids) {
      expect(extendedSourcesA[id].page).toMatch(/^https:\/\/reactbits\.dev\/(backgrounds|animations)\//);
      expect(extendedSourcesA[id].source).toContain('https://github.com/DavidHDev/react-bits/blob/main/src/content/');
      expect(extendedSourcesA[id].mechanism.length).toBeGreaterThan(70);
    }
    const source = readFileSync(new URL('../src/styles/extended-a.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/Math\.random|Date\.now|performance\.now|requestAnimationFrame|setInterval|setTimeout|@keyframes|animation\s*:/);
    expect(source).not.toMatch(/from ['"](?:ogl|gsap|three|vgpu)['"]/);
  });
});
