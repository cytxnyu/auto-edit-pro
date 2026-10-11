import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {PALETTES} from '../../core/src/palettes';
import {catalogBackgroundEffects, type CatalogBackgroundId} from '../src/styles/catalog-backgrounds';

const ids:CatalogBackgroundId[]=['aurora','soft-aurora','silk','iridescence','orb','galaxy','particles','beams','light-rays','pixel-snow','dither','ripple-grid','dot-grid','threads','liquid-chrome','prism','dark-veil','gradient-blinds','plasma','color-bends'];
const custom:[string,string,string]=['#aabbcc','#dd6688','#102030'];
const render=(id:CatalogBackgroundId, frame=91, seed=84219, colors?:[string,string,string], width=1280, height=720, intensity=.65, fps=30)=>{
  const Effect=catalogBackgroundEffects[id];
  return renderToStaticMarkup(<Effect style={{id,seed,intensity,colors}} frame={frame} fps={fps} width={width} height={height}/>);
};
// Measure drawn coordinates only, deliberately excluding metadata, colour and opacity.
const geometry=(markup:string):string=>Array.from(markup.matchAll(/\s(d|points|x|y|cx|cy|r|rx|ry|x1|x2|y1|y2|width|height|transform|gradientTransform)="([^"]*)"/g)).map(m=>m[1]+'='+m[2]).join('|');
const digest=(text:string):string=>createHash('sha256').update(text).digest('hex');

describe('twenty original catalog background adaptations',()=>{
  it('contains precisely the twenty requested, distinct mechanisms',()=>{
    expect(Object.keys(catalogBackgroundEffects)).toEqual(ids);
    expect(new Set(ids.map(id=>render(id).match(/data-effect="([^"]+)"/)?.[1])).size).toBe(20);
    expect(new Set(ids.map(id=>digest(geometry(render(id,91,77,custom))))).size).toBe(20);
  });
  it.each(ids)('%s changes actual geometry after the semantic foreground settles',id=>{
    expect(geometry(render(id,91))).not.toBe(geometry(render(id,113)));
  });
  it.each(ids)('%s is stable under backwards and nonsequential frame seeks',id=>{
    const target=render(id,91);
    for(const frame of [0,113,42,179,0]) render(id,frame);
    expect(render(id,91)).toBe(target);
  });
  it.each(ids)('%s seed changes geometry, not just generated element IDs',id=>{
    expect(geometry(render(id,91,10))).not.toBe(geometry(render(id,91,65530)));
  });
  it.each(ids)('%s uses all three custom colours and shared palette defaults',id=>{
    const html=render(id,91,77,custom);
    for(const color of custom) expect(html).toContain(color);
    const defaultHtml=render(id);
    for(const color of [PALETTES[id].accent,PALETTES[id].line,PALETTES[id].canvas])expect(defaultHtml).toContain(color);
  });
  it.each(ids)('%s stays finite across landscape, portrait and ultra-wide canvases',id=>{
    for(const [width,height] of [[1280,720],[720,1280],[1440,360]]){
      const html=render(id,113,0xffffffff,custom,width,height);
      expect(html).toContain(`viewBox="0 0 ${width} ${height}"`);
      expect(html).not.toMatch(/NaN|Infinity|undefined/);
      for(const m of html.matchAll(/\s(?:r|rx|ry|width|height)="(-?[\d.]+)"/g))expect(Number(m[1])).toBeGreaterThanOrEqual(0);
    }
  });
  it.each(ids)('%s time is measured in seconds and responds to intensity',id=>{
    expect(geometry(render(id,91,77,custom))).toBe(geometry(render(id,182,77,custom,1280,720,.65,60)));
    expect(geometry(render(id,91,77,custom,1280,720,.2))).not.toBe(geometry(render(id,91,77,custom,1280,720,.9)));
  });
  it('records every verified upstream source and an explicit local adaptation',()=>{
    const references=JSON.parse(readFileSync(new URL('../../../references/catalog-backgrounds.json',import.meta.url),'utf8')) as {id:string;name:string;category:string;url:string;sourceUrl:string;mechanism:string;adaptation:string;verified:boolean}[];
    expect(references.map(r=>r.id)).toEqual(ids);
    for(const entry of references){
      expect(entry.category).toBe('backgrounds');
      expect(entry.url).toBe(`https://reactbits.dev/backgrounds/${entry.id}`);
      expect(entry.sourceUrl).toBe(`https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/${entry.name}/${entry.name}.jsx`);
      expect(entry.verified).toBe(true);
      expect(entry.mechanism.length).toBeGreaterThan(50);
      expect(entry.adaptation.length).toBeGreaterThan(50);
    }
  });
  it('uses no autonomous clocks, external media or imported upstream effect engines',()=>{
    const source=readFileSync(new URL('../src/styles/catalog-backgrounds.tsx',import.meta.url),'utf8');
    expect(source).not.toMatch(/Math\.random|Date\.now|performance\.now|requestAnimationFrame|setInterval|setTimeout|@keyframes|animation\s*:/);
    expect(source).not.toMatch(/from ['"](?:ogl|gsap|three|vgpu|@react-three)/);
    for(const id of ids){const html=render(id);expect(html).not.toMatch(/<image|<video|<img|\shref=|\ssrc=/);expect(html).toContain('data-abstract-surface="true"');}
  });
});
