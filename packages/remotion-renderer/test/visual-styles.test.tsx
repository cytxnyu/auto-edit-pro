import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {PALETTES} from '../../core/src/palettes';
import {StyleBackdrop, styleMaterial, type VisualStyleId} from '../src/styles';
import {StageContext} from '../src/stage/context';
import {SideSurface, FullScreenSurface} from '../src/structures/shared';
import {structureProgress} from '../src/stage/StageOverlay';
import {SignalRoute} from '../src/structures/v2/SignalRoute';
import {CommandPalette} from '../src/structures/v2/CommandPalette';

const ids: VisualStyleId[] = ['balatro', 'crt-warp', 'cubes', 'hyperspeed'];
const effectMarkup = (id: VisualStyleId, frame: number, seed = 4221, colors?: [string, string, string]) => renderToStaticMarkup(
  <StyleBackdrop style={{id, seed, intensity: .7, colors}} frame={frame} fps={30} width={1280} height={720}/>,
);
const geometry = (markup: string) => markup.replace(/data-effect-frame="\d+"/, '');

describe('frame-driven visual style renderer', () => {
  it('settles semantic text within 0.85 seconds and retains decorative motion', () => {
    expect(structureProgress(15, 180, 30, true)).toBeCloseTo(15 / 25.5);
    expect(structureProgress(30, 90, 30, true)).toBe(1);
    expect(structureProgress(36, 60, 30, true)).toBe(1);
    expect(structureProgress(66, 90, 30, true)).toBe(1);
    expect(structureProgress(90, 180, 30, true)).toBe(1);
    expect(structureProgress(179, 180, 30, true)).toBe(1);
    expect(structureProgress(30, 180, 30, false)).toBeCloseTo(30 / 179);
  });
  it('decreases texture contrast independently of foreground meaning when intensity is low', () => {
    const render = (intensity: number) => renderToStaticMarkup(<StyleBackdrop style={{id: 'balatro', seed: 1, intensity}} frame={0} fps={30} width={1280} height={720}/>);
    expect(render(.25)).toContain('opacity:0.4375');
    expect(render(.85)).toContain('opacity:0.8875');
    expect(render(.25)).toContain('background:#101a22');
  });
  it.each(ids)('%s produces real geometry and moves between frames', id => {
    const first = effectMarkup(id, 15);
    const later = effectMarkup(id, 48);
    expect(first).toContain(`data-visual-effect="${id}"`);
    expect(first).toContain('<svg');
    expect(first).toContain('<path');
    expect(geometry(first)).not.toBe(geometry(later));
  });
  it.each(ids)('%s is seek-stable, seeded and free from prior frame state', id => {
    const expected = effectMarkup(id, 27);
    for (const frame of [0, 81, 9, 65, 0]) effectMarkup(id, frame);
    expect(effectMarkup(id, 27)).toBe(expected);
    expect(effectMarkup(id, 27, 811)).not.toBe(expected.replace('4221', '811'));
  });
  it.each(ids)('%s supports explicit three-color input', id => {
    const html = effectMarkup(id, 10, 5, ['#ddccaa', '#336699', '#111122']);
    expect(html).toContain('#ddccaa');
    expect(html).toContain('#336699');
    expect(html).toContain('#111122');
  });
  it('has four genuinely distinct mechanisms and material shapes', () => {
    const markup = ids.map(id => effectMarkup(id, 36));
    expect(markup[0]).toContain('liquid-marble');
    expect(markup[1]).toContain('curved-phosphor-raster');
    expect(markup[2]).toContain('isometric-wave-assembly');
    expect(markup[3]).toContain('perspective-speed-road');
    expect(ids.map(id => styleMaterial(id).radius)).toEqual([18, 2, 0, 4]);
    expect(styleMaterial('crt-warp').fontFamily).toContain('monospace');
  });
  it('contains no unseeded RNG, wall clock, timer or autonomous browser animation', () => {
    const source = readFileSync(new URL('../src/styles/index.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/Math\.random|Date\.now|performance\.now|requestAnimationFrame|setInterval|setTimeout|@keyframes|animation\s*:/);
  });
  it.each(ids)('%s styles the actual semantic surface without hiding the backdrop', id => {
    const html = renderToStaticMarkup(<StageContext.Provider value={{surface: 'opaque', surfaceOpacity: 1, dualRail: false, visualStyle: id}}>
      <SideSurface side="left" palette={PALETTES[id]}>内容</SideSurface>
    </StageContext.Provider>);
    expect(html).toContain(`border-radius:${styleMaterial(id).radius}${styleMaterial(id).radius ? 'px' : ''}`);
    expect(html).toContain('opacity:0.16');
    expect(html).not.toContain('bottom:0');
    expect(html).toContain('内容');
  });
  it('does not create an opaque semantic surface for transparent stages', () => {
    const html = renderToStaticMarkup(<StageContext.Provider value={{surface: 'transparent', surfaceOpacity: 1, dualRail: false, visualStyle: 'crt-warp'}}>
      <FullScreenSurface mode="opaque" palette={PALETTES['crt-warp']}>内容</FullScreenSurface>
    </StageContext.Provider>);
    expect(html).not.toContain('linear-gradient');
  });
  it('anchors stage route labels in the same untruncated grid tracks as their nodes', () => {
    const html = renderToStaticMarkup(<StageContext.Provider value={{surface: 'opaque', surfaceOpacity: 1, dualRail: false, visualStyle: 'hyperspeed'}}>
      <SignalRoute content={{structure: 'signal-route', nodes: ['输入', '执行', '验证'], routeLabel: '任务执行路径', result: '每一步都有结果'}} progress={1} palette={PALETTES.hyperspeed} placement="full"/>
    </StageContext.Provider>);
    expect((html.match(/data-route-label-anchor=/g) ?? [])).toHaveLength(3);
    for (const point of ['node-1', 'node-2', 'node-3']) expect(html).toContain(`data-route-label-anchor="${point}"`);
    expect(html).toContain('font-size:40px');
    expect(html).not.toContain('<foreignObject');
    expect(html).not.toContain('inset:15% 7% 22%');
  });
  it('uses square numbered action rows for Cubes rather than legacy rounded command rows', () => {
    const html = renderToStaticMarkup(<StageContext.Provider value={{surface: 'opaque', surfaceOpacity: 1, dualRail: false, visualStyle: 'cubes'}}>
      <CommandPalette content={{structure: 'command-palette', commandTitle: '行动', actions: ['输入', '执行', '验证'], resultState: '结果'}} progress={1} palette={PALETTES.cubes} placement="left"/>
    </StageContext.Provider>);
    expect(html).toContain('>01</span>');
    expect(html).toContain('>03</span>');
    expect(html).not.toContain('border-radius:13px');
  });
});
