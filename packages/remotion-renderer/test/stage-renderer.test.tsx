import {createHash} from 'node:crypto';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {Stage} from '../../core/src/schema';
import {PALETTES} from '../../core/src/palettes';
import {structureRegistry} from '../src/structures';
import {StageContext} from '../src/stage/context';
import {StageKeyword} from '../src/stage/StageOverlay';
import {activeCaptionHandoff, resolveStageFrame, stageSubtitleClip, stageViewport, subjectFramePath} from '../src/stage/model';
import {fixtureContent, renderStructure} from './stage-fixtures';
const stage: Stage = {x: .1, y: .2, width: .8, height: .6, depth: 'front', surface: 'template'};
const originalHashes = {
  'editorial-dual-rail': 'c4f3c72964f30fd5b6f09c1491907768a7ca62c093375ff85885c40fe97e938b',
  'thesis-and-proof': '26079a8dd815a1d31eade036bcfe0629d817de8020699b861d9d90150152e04f',
  'bidirectional-flow': 'a2f9934ffbff3635073ed06c7f2edc5c17eb8e106bfdfd5de5b14519c4a2dd5b',
  'command-palette': '9cb02f141aa466086cfdf7bf38edd0b764edec1add280e9cd03a1cd4d2cecd21',
  'four-stage-pipeline': '1fcdc10c6d6a6a501b1600caae8514f557e47b0899b614cf9982a9b50253982c',
  'before-after-scrub': '3a9902aff30d14e65f959506d563a7a0688d5191fdfefc2a22b79a28e4361d1c',
  'evidence-panel': '0024b6e792ff0710144aeab31658dfc349429803c4e5f621dc483b17031a95db',
  'metric-odometer': '61e2f4c51aad9df6b107e11f864bb1524428c2d21304941d36a074b2a77f9db9',
  'signal-route': '57f3688f2951fb57cce3131e3aef72247ea8e11b45ed16db33dd86a8ddb9b960',
  'semantic-doodle': '4828e416f7440137f83ea21f30153b963363f55c75422f9cc43ba9ec83ce66c7',
} as const;

describe('whole screen stage renderer', () => {
  it.each(Object.keys(originalHashes) as (keyof typeof originalHashes)[])('keeps no-stage %s byte-identical to pre-upgrade static markup', (key) => {
    expect(createHash('sha256').update(renderStructure(key)).digest('hex')).toBe(originalHashes[key]);
  });
  it('defaults missing numeric properties without affecting the source object', () => {
    const pose = resolveStageFrame(stage, 0);
    expect(pose).toMatchObject({x: .1, y: .2, scale: 1, opacity: 1, surfaceOpacity: 1, rotation: 0, depth: 'front'});
    expect(stage).not.toHaveProperty('scale');
  });
  it('interpolates independent sparse numeric keyframes and holds endpoints', () => {
    const animated: Stage = {...stage, keyframes: [{frame: 0, x: 0}, {frame: 10, x: 1}, {frame: 20, opacity: 0}, {frame: 30, x: 2}]};
    expect(resolveStageFrame(animated, 5).x).toBe(.5);
    expect(resolveStageFrame(animated, 15).x).toBe(1.25);
    expect(resolveStageFrame(animated, 10).opacity).toBe(.5);
    expect(resolveStageFrame(animated, 80).x).toBe(2);
  });
  it('switches depth on the exact observed frame rather than cross-fading an opaque duplicate', () => {
    const animated: Stage = {...stage, keyframes: [{frame: 15, depth: 'behind-subject'}, {frame: 40, depth: 'front'}]};
    expect([14,15,39,40].map((f) => resolveStageFrame(animated,f).depth)).toEqual(['front','behind-subject','behind-subject','front']);
  });
  it('is independent of render order and repeated seeks', () => {
    const animated: Stage = {...stage,keyframes:[{frame:9,x:.8,rotation:12,opacity:.4},{frame:39,x:-.3,rotation:0,opacity:1}]};
    const sequential = Array.from({length: 60}, (_,frame) => resolveStageFrame(animated, frame));
    for (const frame of [59,9,0,27,39,14,0,9]) expect(resolveStageFrame(animated,frame)).toEqual(sequential[frame]);
  });
  it('permits subtitle cover only inside explicit local [start,end) handoff interval', () => {
    const withHandoff: Stage = {...stage,coverSubtitles:true,captionHandoffs:[{startFrame:12,endFrame:24,keyword:'素材',x:.5,y:.9}]};
    expect([11,12,23,24].map((frame) => Boolean(activeCaptionHandoff(withHandoff,frame)))).toEqual([false,true,true,false]);
    expect(stageSubtitleClip(withHandoff,11)).toBe('inset(0 0 18% 0)');
    expect(stageSubtitleClip(withHandoff,12)).toBe('inset(0 0 0 0)');
    expect(stageSubtitleClip(withHandoff,24)).toBe('inset(0 0 18% 0)');
    expect(activeCaptionHandoff({...withHandoff,coverSubtitles:false},15)).toBeUndefined();
  });
  it('reads exact six-digit GLOBAL alpha frame filenames and rejects missing range', () => {
    const sequence = {type:'png-sequence' as const,pattern:'subject/frame-{frame}.png',frameCount:120};
    expect(subjectFramePath(sequence,39)).toBe('subject/frame-000039.png');
    expect(() => subjectFramePath(sequence,120)).toThrow('no aligned source frame');
    expect(() => subjectFramePath(sequence,1.5)).toThrow('no aligned source frame');
  });
  it.each(Object.keys(fixtureContent) as (keyof typeof fixtureContent)[])('retains original %s identity/palette while removing fixed stage-safe gaps', (key) => {
    const entry = structureRegistry[key];
    const html = renderToStaticMarkup(<StageContext.Provider value={{surface:'template',surfaceOpacity:.6,dualRail:key==='editorial-dual-rail'}}><entry.Component content={fixtureContent[key]} progress={.72} palette={PALETTES['deep-ocean']} placement={entry.safeZone === 'full' ? 'full' : 'left'}/></StageContext.Provider>);
    expect(html).toContain(`data-structure-identity="${key}"`);
    expect(html).toContain('#f6f2e8');
    expect(html).not.toContain('data-presenter-window="35-65"');
    expect(html).not.toContain('data-overlay-zone=');
    expect(html).not.toContain('gap:36%');
  });
  it('fits a stage design viewport inside arbitrary geometry without reserving a center lane', () => {
    for (const [w,h] of [[1200,700],[500,900],[1800,350]]) {
      const viewport = stageViewport('command-palette','left',w,h);
      expect(viewport.width*viewport.fit).toBeCloseTo(w);
      expect(viewport.height*viewport.fit).toBeCloseTo(h);
    }
  });
  it('keeps handoff keywords readable at every canvas edge and independent of stage opacity', () => {
    for (const [x,y] of [[0,0],[1,1],[.5,.5]]) {
      const html = renderToStaticMarkup(<StageKeyword handoff={{startFrame:0,endFrame:9,keyword:'素材',x,y}} paletteId="deep-ocean" canvasWidth={1920}/>);
      expect(html).toContain(`left:${2+x*96}%`);
      expect(html).toContain(`top:${2+y*96}%`);
      expect(html).toContain('z-index:30');
      expect(html).not.toContain('opacity:');
    }
  });
});
