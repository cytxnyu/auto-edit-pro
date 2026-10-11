import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {PALETTES} from '../../core/src/palettes';
import {catalogComponentEffects} from '../src/styles/catalog-components';
import type {StyleBackdropProps} from '../src/styles';

const ids = ['animated-list', 'magic-bento', 'tilted-card', 'spotlight-card', 'pixel-card', 'glass-surface', 'fluid-glass', 'stack', 'card-swap', 'bounce-cards', 'dock', 'gooey-nav', 'stepper', 'folder', 'elastic-slider'] as const;
type Id = typeof ids[number];
const markup = (id: Id, frame = 91, seed = 137, colors?: [string, string, string], width = 1280, height = 720, intensity = .65): string => {
  const Effect = catalogComponentEffects[id];
  const props: StyleBackdropProps = {style: {id, seed, intensity, colors}, frame, fps: 30, width, height};
  return renderToStaticMarkup(<Effect {...props}/>);
};
const geometry = (html: string): string[] => html.match(/\s(?:d|points|x|y|cx|cy|r|rx|ry|width|height|transform)="[^"]*"/g) ?? [];

describe('fifteen original component-derived decorative mechanisms', () => {
  it('registers exactly the assigned component IDs', () => expect(Object.keys(catalogComponentEffects).sort()).toEqual([...ids].sort()));
  it.each(ids)('%s remains geometrically animated after foreground settling', id => {
    const a = markup(id, 91);
    const b = markup(id, 113);
    expect(a).toContain('<svg');
    expect(geometry(a).length).toBeGreaterThan(6);
    expect(geometry(a)).not.toEqual(geometry(b));
  });
  it.each(ids)('%s is seek-deterministic and visibly seed-dependent', id => {
    const expected = markup(id, 91);
    for (const frame of [113, 0, 31, 700, 19]) markup(id, frame);
    expect(markup(id, 91)).toBe(expected);
    expect(geometry(markup(id, 91, 48271))).not.toEqual(geometry(expected));
  });
  it.each(ids)('%s accepts three exact custom colors and palette defaults', id => {
    const colors: [string, string, string] = ['#d92f52', '#4ace7b', '#150c27'];
    const custom = markup(id, 91, 137, colors);
    for (const color of colors) expect(custom).toContain(color);
    const defaults = markup(id);
    for (const color of [PALETTES[id].accent, PALETTES[id].line, PALETTES[id].canvas]) expect(defaults).toContain(color);
  });
  it.each(ids)('%s has finite vector geometry at wide, tall and square sizes', id => {
    for (const [width, height] of [[1920, 1080], [720, 1280], [800, 800], [2560, 600]]) {
      const html = markup(id, 113, 137, undefined, width, height);
      expect(html).toContain(`viewBox="0 0 ${width} ${height}"`);
      expect(html).not.toMatch(/NaN|Infinity|undefined/);
      expect(geometry(html).length).toBeGreaterThan(6);
    }
  });
  it.each(ids)('%s responds to intensity in actual geometry', id => {
    expect(geometry(markup(id, 113, 137, undefined, 1280, 720, 0))).not.toEqual(geometry(markup(id, 113, 137, undefined, 1280, 720, 1)));
  });
  it('has fifteen distinct mechanisms without fabricated text, media or controls', () => {
    const html = ids.map(id => markup(id));
    expect(new Set(html.map(s => /data-effect="([^"]+)"/.exec(s)?.[1])).size).toBe(15);
    expect(new Set(html.map(s => JSON.stringify(geometry(s)))).size).toBe(15);
    for (const s of html) expect(s).not.toMatch(/<(?:text|image|img|video|audio|button|input|a)\b/);
  });
  it.each(['gooey-nav','stepper','elastic-slider'] as const)('%s keeps its main controls below centered text in all aspect ratios',id=>{
    for(const [width,height] of [[1280,720],[720,1280],[800,800],[2560,600]]) for(const frame of [0,91,113,360]){
      const html=markup(id,frame,137,undefined,width,height);
      const transform=html.match(/translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)/)!;
      const offsetY=Number(transform[2]), scale=Number(transform[3]);
      const circles=[...html.matchAll(/<(?:circle|ellipse)\b[^>]*>/g)];
      expect(circles.length).toBeGreaterThan(0);
      for(const match of circles){
        const tag=match[0],cy=Number(tag.match(/\scy="([-\d.]+)"/)![1]);
        const r=Number(tag.match(/\s(?:r|ry)="([-\d.]+)"/)![1]);
        const y=offsetY+cy*scale;
        expect(y/height).toBeGreaterThan(.59);expect(y/height).toBeLessThan(.84);
        expect(y-r*scale).toBeGreaterThan(0);expect(y+r*scale).toBeLessThan(height);
      }
    }
  });
  it('contains no clocks, device listeners or unseeded randomness', () => {
    const source = readFileSync(new URL('../src/styles/catalog-components.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/Math\.random|Date\.now|performance\.now|requestAnimationFrame|setInterval|setTimeout|@keyframes|addEventListener|getUserMedia/);
  });
  it('has verified reference metadata for all fifteen component mechanisms', () => {
    const references = JSON.parse(readFileSync(new URL('../../../references/catalog-components.json', import.meta.url), 'utf8')) as Array<{id: string; category: string; verified: boolean; url: string; sourceUrl: string; mechanism: string; adaptation: string}>;
    expect(references.map(row => row.id).sort()).toEqual([...ids].sort());
    for (const row of references) {
      expect(row.category).toBe('components');
      expect(row.verified).toBe(true);
      expect(row.url).toBe(`https://reactbits.dev/components/${row.id}`);
      expect(row.sourceUrl).toMatch(/^https:\/\/github\.com\/DavidHDev\/react-bits\/blob\/main\/src\/content\/Components\/[^/]+\/[^/]+\.jsx$/);
      expect(row.mechanism.length).toBeGreaterThan(20);
      expect(row.adaptation.length).toBeGreaterThan(20);
    }
  });
});
