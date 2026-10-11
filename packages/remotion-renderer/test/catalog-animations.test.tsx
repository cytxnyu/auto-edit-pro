import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {PALETTES} from '../../core/src/palettes';
import {catalogAnimationEffects} from '../src/styles/catalog-animations';
import type {StyleBackdropProps} from '../src/styles';

const ids = ['magic-rings', 'laser-flow', 'magnet-lines', 'antigravity', 'ribbons', 'meta-balls', 'star-border', 'pixel-trail', 'noise', 'shape-blur', 'crosshair', 'click-spark', 'pixel-transition', 'glare-hover', 'sticker-peel'] as const;
type Id = typeof ids[number];
const render = (id: Id, frame: number, seed = 5173, size: [number, number] = [1280,720], customColors?: [string,string,string], intensity = .65): string => {
  const Effect = catalogAnimationEffects[id];
  const props: StyleBackdropProps = {style: {id, seed, intensity, colors: customColors}, frame, fps: 30, width: size[0], height: size[1]};
  return renderToStaticMarkup(<Effect {...props}/>);
};
const geometry = (markup: string): string[] => markup.match(/\s(?:d|points|x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|width|height|transform)="[^"]*"/g) ?? [];

describe('15 original deterministic animation catalog effects', () => {
  it('registers exactly the assigned IDs with distinct geometric mechanisms and source records', () => {
    expect(Object.keys(catalogAnimationEffects)).toEqual(ids);
    const records = JSON.parse(readFileSync(new URL('../../../references/catalog-animations.json', import.meta.url), 'utf8')) as {id: string; name: string; category: string; url: string; sourceUrl: string; mechanism: string; adaptation: string; verified: boolean}[];
    expect(records.map(r => r.id)).toEqual(ids);
    for (const record of records) {
      expect(record.category).toBe('animations');
      expect(record.url).toBe(`https://reactbits.dev/animations/${record.id}`);
      expect(record.sourceUrl).toMatch(/^https:\/\/github\.com\/DavidHDev\/react-bits\/blob\/main\/src\/content\/Animations\/[^/]+\/[^/]+\.jsx$/);
      expect(record.verified).toBe(true);
      expect(record.mechanism.length).toBeGreaterThan(35);
      expect(record.adaptation.length).toBeGreaterThan(70);
    }
    const output = ids.map(id => render(id, 91));
    expect(new Set(output.map(html => /data-effect="([^"]+)"/.exec(html)?.[1])).size).toBe(15);
    expect(new Set(output.map(html => JSON.stringify(geometry(html)))).size).toBe(15);
  });
  it.each(ids)('%s moves actual geometry at early and late frames, including 91/113', id => {
    const a = render(id, 13), b = render(id, 43), c = render(id, 91), d = render(id, 113);
    expect(a).toContain('<svg');
    expect(geometry(a).length).toBeGreaterThan(5);
    expect(geometry(a)).not.toEqual(geometry(b));
    expect(geometry(c)).not.toEqual(geometry(d));
    for (const markup of [a,b,c,d]) expect(markup).not.toMatch(/NaN|Infinity|undefined/);
  });
  it.each(ids)('%s is seek-independent and its seed changes geometric positions', id => {
    const expected = render(id, 91);
    for (const frame of [113,0,17,5,60]) render(id, frame);
    expect(render(id,91)).toBe(expected);
    expect(geometry(render(id,91,929))).not.toEqual(geometry(expected));
    expect(geometry(render(id,91,0))).not.toEqual(geometry(render(id,91,4294967295)));
  });
  it.each(ids)('%s respects its palette, explicit colors and differing canvas aspect ratios', id => {
    const defaults = render(id,43);
    for (const color of [PALETTES[id].accent, PALETTES[id].line, PALETTES[id].canvas]) expect(defaults).toContain(color);
    const custom: [string,string,string] = ['#e81975','#71ce29','#160f31'];
    for (const size of [[1280,720],[720,1280],[640,640]] as [number,number][]) {
      const markup = render(id, 113,5173,size,custom);
      expect(markup).toContain(`viewBox="0 0 ${size[0]} ${size[1]}"`);
      for (const color of custom) expect(markup).toContain(color);
      expect(markup).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
  it.each(ids)('%s intensity changes its choreography without touching semantic content', id => {
    expect(geometry(render(id,113,5173,[1280,720],undefined,0))).not.toEqual(geometry(render(id,113,5173,[1280,720],undefined,1)));
    expect(render(id,91)).not.toMatch(/<(?:text|image|img|video|audio|foreignObject)\b|(?:src|href)="https?:/);
  });
  it('has no autonomous clock, event listener, unseeded RNG, or stateful animation dependency', () => {
    const source = readFileSync(new URL('../src/styles/catalog-animations.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/Math\.random|Date\.now|performance\.now|requestAnimationFrame|setTimeout|setInterval|addEventListener|@keyframes|useState|useEffect|gsap|framer-motion/);
  });
});
