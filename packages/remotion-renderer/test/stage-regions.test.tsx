import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';
import {staticFile} from 'remotion';
import type {StageRegion, Storyboard, StoryboardBeat} from '../../core/src/schema';
import {PALETTES} from '../../core/src/palettes';
import {StageOverlay} from '../src/stage/StageOverlay';
import {StageContext} from '../src/stage/context';
import {isFullStageRegion, stageRegionRect} from '../src/stage/model';
import {StyleBackdrop} from '../src/styles';
import {structureRegistry} from '../src/structures';
import {StyleProof} from '../src/StyleProof';
import {fixtureContent} from './stage-fixtures';
const state = vi.hoisted(() => ({frame: 0}));
// Only Remotion's composition context is supplied; all registered renderers stay real.
vi.mock('remotion', async (importOriginal) => ({...await importOriginal<typeof import('remotion')>(), useCurrentFrame: () => state.frame, useVideoConfig: () => ({width: 1920, height: 1080, fps: 60, durationInFrames: 240})}));
const full: StageRegion = {x: 0, y: 0, width: 1, height: 1};
const contentRegion: StageRegion = {x: .1, y: .2, width: .55, height: .75};
const styleRegion: StageRegion = {x: .65, y: .1, width: .35, height: .8};
const makeBeat = (structure: keyof typeof fixtureContent = 'thesis-and-proof'): StoryboardBeat => ({
  id: 'region-fixture', start: 0, end: 4, text: 'Registered semantic content', structure, content: fixtureContent[structure],
  motions: ['reveal'], placement: 'full', palette: 'hyperspeed', visualStyle: {id: 'hyperspeed', seed: 4242, intensity: .7}, directorRole: 'definition',
  stage: {x: .05, y: .08, width: .8, height: .6, depth: 'front', surface: 'opaque'},
  ...(structure === 'evidence-panel' ? {evidence: {src: 'evidence/doc.png', label: 'Official source'}} : {}),
});
const render = (beat: StoryboardBeat, frame = 72): string => {state.frame = frame; return renderToStaticMarkup(<StageOverlay beat={beat}/>);};
const tag = (html: string, attribute: string): string => html.match(new RegExp(`<div ${attribute}="[^"]*"[^>]*>`))?.[0] ?? '';
// Captured from the 0.7.0 StageOverlay before the additive region implementation.
const baselineHashes: Record<string, string> = {
  "editorial-dual-rail:0": "866b9082279ab93af697b0d60d38c2da0f709c7becbeeb4433cfcb0d7bb12f7d",
  "editorial-dual-rail:72": "4e1b6532a8d4265fe678577af00ace4d7d6abef81215c99c5234ef2ed651330b",
  "editorial-dual-rail:150": "c67cf92e01c5437db07c8a2b4cdd2b266bdc6d6374511787f5ff1ed89f8591ef",
  "thesis-and-proof:0": "20422c1ce7451b05264c5496b34a44e779eab74ea5bfe5fc610c6ad518a6cac1",
  "thesis-and-proof:72": "1373f3843549e5243cd57d4f01cb3d33a7c6654f0d742af40cc0671bac5107e4",
  "thesis-and-proof:150": "c3fb9ff12c5433f0c712309e7226ec7d3502818e5d5e1b8361a326717ddf3572",
  "bidirectional-flow:0": "f91e38e92160670735a3946959863a57eaab1f5779d587b6190490a2d69f9421",
  "bidirectional-flow:72": "3253560b47ea443bfb215d32294dbe7f4b42e26bafce79a95202715dc2a2f774",
  "bidirectional-flow:150": "f574f4f2639662ba7ed36806400a8701f2775408b3b138d49c9237ab21e3727a",
  "command-palette:0": "23ff59337bdc7c25453539bedf164fef649ab47abbb5b03cc7780f51766275f7",
  "command-palette:72": "ca375ea3bfb490c963798293afe6f2f44dff4d91665c273a80e08c63c43b7a5c",
  "command-palette:150": "6843f61dd59620f4a3df47286433a913ad7d846b6de5a655ed6272749a87407b",
  "four-stage-pipeline:0": "60fff3bda73fdb9d8a6433e44d01cd00ef78087ba06b02467d08b638faa35fe3",
  "four-stage-pipeline:72": "f7a42d9e9c8c76f7f0ec6be3b8b85f299e547082a702af679677958f0fa092d0",
  "four-stage-pipeline:150": "658a6463ed13a45304d1aebcc12f47b2790326a5c649d3f033719a3979c6c34e",
  "before-after-scrub:0": "b5b7a6e55c16bd41010c5a241102938b93a9712361139b4ce0ffebf9b1cea92d",
  "before-after-scrub:72": "e2328177a134e536be745e2d481c0c565c14725c8bb71a4a074d687ef782a86b",
  "before-after-scrub:150": "9ce9bf6b0b6a20f5d2c5dc3d360fbdd765dcd19c199a5c75097af49345d2a3ab",
  "evidence-panel:0": "5953fc5cf28553c7fd77569247a656b435c712cfc7b03201d101443493d1fe84",
  "evidence-panel:72": "0ce1b7ed1698f4e41dabc5388a476d734ca208c47767589085ac2746380a939a",
  "evidence-panel:150": "2ad600b4c0d26f773e43140aa6cc054d26eb852ebcdf0fe868e326fd0b43ba13",
  "metric-odometer:0": "d5f18d665f7ef9e593daa942dacc876ed90d850b7fc768181a57bc0bf8a80a4e",
  "metric-odometer:72": "dd6aa6f3aa3677f7d7fd4cb25168b6377affaf12992a6e611adb039bc5bace82",
  "metric-odometer:150": "e48593203f93e0000a3866d79f3cdddafadeb0f99bdc844eaf552a6211fa33d3",
  "signal-route:0": "1c371725c125a17d82d2541358e5e7998c722cd4713a7f8324e3e47ff139571b",
  "signal-route:72": "6a9cfdbcc9a2f76903ae8f26df4f979514e0df26315cb959829e233f0f1698ba",
  "signal-route:150": "28ea7c9aafe622c494a8c4d22ccf348f0f9a93132023a66ab96ca0d1afd0074a",
  "semantic-doodle:0": "9dc537f7befd2f186d0497e69135cf1ec886ea07f0eab2924ac15c7c51947407",
  "semantic-doodle:72": "4f7b8bce9b56e450a73bff4520f9eb52d3b96c9ee91979f96cf1e6b709224ac5",
  "semantic-doodle:150": "9d7f0b9d412a1513ab3cda695f56044c463ac7a92cbb807a88b8a0d6d3069afd"
};

describe('region geometry and unchanged default render', () => {
  it.each(Object.keys(baselineHashes))('keeps pre-region default markup byte-identical: %s', key => {
    const [structure, frame] = key.split(':');
    expect(createHash('sha256').update(render(makeBeat(structure as keyof typeof fixtureContent), Number(frame))).digest('hex')).toBe(baselineHashes[key]);
  });
  it.each(Object.keys(fixtureContent) as (keyof typeof fixtureContent)[])('keeps explicit full regions exactly equivalent for %s', structure => {
    const beat = makeBeat(structure);
    const before = render(beat);
    beat.stage!.contentRegion = full; beat.stage!.styleRegion = full;
    expect(render(beat)).toBe(before);
  });
  it.each([[1536, 648], [700, 260], [500, 900]])('maps normalized regions into physical %d × %d pixels without shrinking text', (width, height) => {
    expect(stageRegionRect(undefined, width, height)).toEqual({left: 0, top: 0, width, height});
    expect(stageRegionRect(full, width, height)).toEqual(stageRegionRect(undefined, width, height));
    expect(stageRegionRect(contentRegion, width, height)).toEqual({left: .1 * width, top: .2 * height, width: .55 * width, height: .75 * height});
    expect(isFullStageRegion(full)).toBe(true); expect(isFullStageRegion()).toBe(true); expect(isFullStageRegion(contentRegion)).toBe(false);
  });
  it.each(Object.keys(fixtureContent) as (keyof typeof fixtureContent)[])('places the real registered %s in its content rect with unchanged content/fonts', structure => {
    const beat = makeBeat(structure); beat.stage!.contentRegion = contentRegion;
    const html = render(beat);
    expect(tag(html, 'data-stage-content-region')).toContain('left:153.60000000000002px;top:129.6px;width:844.8000000000001px;height:486px');
    expect(tag(html, 'data-stage-content-region')).not.toContain('transform');
    const Structure = structureRegistry[structure].Component;
    const expected = renderToStaticMarkup(<StageContext.Provider value={{surface: 'opaque', surfaceOpacity: 1, dualRail: structure === 'editorial-dual-rail', visualStyle: 'hyperspeed'}}><Structure content={beat.content} progress={1} palette={PALETTES.hyperspeed} placement="full" evidence={beat.evidence ? {...beat.evidence, src: staticFile(beat.evidence.src)} : undefined}/></StageContext.Provider>);
    expect(html).toContain(expected.replace(/^<link[^>]*\/>/, ''));
    expect(html).toContain(`data-structure-identity="${structure}"`);
    expect(html).toContain('container-type:size');
    expect(html).not.toContain('data-stage-region-fill=');
  });
  it.each(['crosshair', 'circular-carousel', 'lightning'] as const)('renders actual %s geometry at region dimensions, not a scaled full-stage field', id => {
    const beat = makeBeat(); beat.visualStyle!.id = id; beat.palette = id; beat.stage!.styleRegion = styleRegion;
    const html = render(beat);
    const rect = stageRegionRect(styleRegion, 1536, 648);
    const actualBackdrop = renderToStaticMarkup(<StyleBackdrop style={beat.visualStyle!} frame={72} fps={60} width={rect.width} height={rect.height}/>);
    expect(html).toContain(actualBackdrop);
    expect(tag(html, 'data-stage-style-region')).toContain(`left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`);
    expect(tag(html, 'data-stage-style-region')).not.toContain('transform');
    expect(tag(html, 'data-stage-region-fill')).toContain(`background:${PALETTES[id].canvas}`);
    expect((html.match(/data-visual-effect=/g) ?? [])).toHaveLength(1);
    expect((html.match(/<div data-stage-visual-style=/g) ?? [])).toHaveLength(1);
  });
  it('keeps a transparent stage transparent and the semantic region active', () => {
    const beat = makeBeat(); Object.assign(beat.stage!, {surface: 'transparent', contentRegion, styleRegion});
    const html = render(beat);
    expect(html).toContain('data-stage-content-region=');
    expect(html).not.toContain('data-stage-region-fill='); expect(html).not.toContain('data-visual-effect=');
  });
  it('keeps physical regions stable while unmodified decorative frame time advances', () => {
    const beat = makeBeat(); Object.assign(beat.stage!, {contentRegion, styleRegion});
    const before = render(beat, 72), after = render(beat, 150);
    expect(tag(before, 'data-stage-content-region')).toBe(tag(after, 'data-stage-content-region'));
    expect(tag(before, 'data-stage-style-region')).toBe(tag(after, 'data-stage-style-region'));
    expect(before).toContain('data-effect-frame="72"'); expect(after).toContain('data-effect-frame="150"');
    expect(before.replace('data-effect-frame="72"', '')).not.toBe(after.replace('data-effect-frame="150"', ''));
    expect(render(beat, 72)).toBe(before);
  });
  it('maps regions within the animated outer stage pose, never animating region coordinates', () => {
    const beat = makeBeat(); Object.assign(beat.stage!, {contentRegion, styleRegion, keyframes: [{frame: 120, width: 1}]});
    const html = render(beat, 60);
    const rect = stageRegionRect(styleRegion, .9 * 1920, 648);
    expect(tag(html, 'data-stage-style-region')).toContain(`width:${rect.width}px`);
    expect(beat.stage!.styleRegion).toEqual(styleRegion);
  });
});

describe('StyleProof remains the actual registered implementation', () => {
  it('keeps the existing StyleProof source hash unchanged', () => {
    expect(createHash('sha256').update(readFileSync(new URL('../src/StyleProof.tsx', import.meta.url))).digest('hex')).toBe('01beb92003e7d2fb2dc9c3e17ba8074e85522bbb25d875bb7327a0b96b17cb1a');
  });
  it.each([false, true])('uses the same StageOverlay and one actual backdrop with regions=%s', regions => {
    const beat = makeBeat('metric-odometer'); if (regions) Object.assign(beat.stage!, {contentRegion, styleRegion});
    const storyboard = {beats: [beat]} as Storyboard;
    state.frame = 72;
    const proof = StyleProof({storyboard, beatId: beat.id});
    const child = (proof.props as {children: {type: unknown; props: {beat: StoryboardBeat}}}).children;
    expect(child.type).toBe(StageOverlay); expect(child.props.beat).toBe(beat);
    const html = renderToStaticMarkup(proof);
    expect(html).toContain(render(beat));
    expect((html.match(/data-visual-effect=/g) ?? [])).toHaveLength(1);
    expect(html).toContain('data-structure-identity="metric-odometer"');
  });
});
