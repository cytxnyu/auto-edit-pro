import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {pngFacts, prepareSubjectFrames, readSavedStoryboard} from '../scripts/lib/stage-inputs';
import type {Storyboard} from '../packages/core/src/schema';

const roots: string[] = [];
const temp = () => {const dir = mkdtempSync(join(tmpdir(), 'stage-input-')); roots.push(dir); return dir;};
afterEach(() => roots.splice(0).forEach((dir) => {
  if (dirname(resolve(dir)) !== resolve(tmpdir()) || !basename(dir).startsWith('stage-input-')) throw new Error('Unexpected test cleanup target');
  rmSync(dir, {recursive: true, force: true});
}));
const alphaPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEUlEQVR4nGNgYGBg+M/A8B8ABQQB/8twlDcAAAAASUVORK5CYII=', 'base64');
const board = (): Storyboard => ({version: '2.0', id: 'stage-test', title: 'Stage', duration: .1, fps: 30, width: 2, height: 1, captionsMode: 'none', source: {video: 'input.mp4', subject: {type: 'png-sequence', pattern: 'subject/frame-{frame}.png', frameCount: 3}}, theme: {background: '#07111f', foreground: '#f6f8fb', accent: '#5eead4'}, beats: [{id: 'b', start: 0, end: .1, text: '抬起', structure: 'thesis-and-proof', content: {structure: 'thesis-and-proof', thesis: '抬起', reason: '真实动作'}, motions: ['lift'], placement: 'full', palette: 'deep-ocean', directorRole: 'hook', stage: {x: -.2, y: 0, width: 1.4, height: 1, depth: 'behind-subject', surface: 'transparent', interaction: 'gesture', gesture: {observedFrames: [0, 2], description: 'Synthetic fixture observation only'}, keyframes: [{frame: 0, x: -.2}, {frame: 2, x: .2}]}}]});

describe('stage source inputs', () => {
  it('reads the authored presentation without replanning it', () => {
    const dir = temp(), file = join(dir, 'storyboard.json'), value = board(); writeFileSync(file, JSON.stringify(value));
    expect(readSavedStoryboard(file, value)).toEqual(value);
    expect(() => readSavedStoryboard(file, {...value, width: 4})).toThrow('canvas/timeline');
  });
  it('distinguishes real alpha-channel images and bad input', () => {
    expect(pngFacts(alphaPng)).toEqual({width: 2, height: 1, hasAlpha: true});
    const rgb = Buffer.from(alphaPng); rgb[25] = 2; expect(pngFacts(rgb).hasAlpha).toBe(false);
    expect(() => pngFacts(Buffer.from('not png'))).toThrow('not a PNG');
  });
  it('copies every source-aligned frame, decodes alpha, and records hashes', () => {
    const dir = temp(), src = join(dir, 'src'), pub = join(dir, 'public'); mkdirSync(src); mkdirSync(pub);
    for (let frame = 0; frame < 3; frame++) writeFileSync(join(src, `frame-${String(frame).padStart(6, '0')}.png`), alphaPng);
    prepareSubjectFrames(board(), pub, src);
    const manifest = JSON.parse(readFileSync(join(pub, 'SUBJECT_MANIFEST.json'), 'utf8'));
    expect(manifest.frames).toHaveLength(3); expect(manifest.sampledAlphaVariation).toBe(true);
    expect(readFileSync(join(pub, 'subject/frame-000002.png'))).toEqual(alphaPng);
  });
  it('fails on a missing frame, mismatched canvas, or opaque PNG', () => {
    const dir = temp(), src = join(dir, 'src'), pub = join(dir, 'public'); mkdirSync(src); mkdirSync(pub);
    expect(() => prepareSubjectFrames(board(), pub, src)).toThrow('Missing subject frame');
    writeFileSync(join(src, 'frame-000000.png'), alphaPng);
    expect(() => prepareSubjectFrames({...board(), width: 4}, pub, src)).toThrow('source-sized');
    const rgb = Buffer.from(alphaPng); rgb[25] = 2; writeFileSync(join(src, 'frame-000000.png'), rgb);
    expect(() => prepareSubjectFrames(board(), pub, src)).toThrow('RGBA');
  });
  it('rejects escape paths even if supplied to the asset helper without schema parsing', () => {
    const value = board(); value.source.subject!.pattern = '../frame-{frame}.png';
    expect(() => prepareSubjectFrames(value, temp())).toThrow('escapes');
  });
});
