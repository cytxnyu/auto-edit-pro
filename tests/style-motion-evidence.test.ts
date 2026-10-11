import {describe, expect, it} from 'vitest';
import type {VisualContract} from '../packages/core/src/visual-contract';
import {assertMotionDelta, compareRgb, selectProofFrames} from '../scripts/lib/style-motion-evidence';
import {structureProgress} from '../packages/remotion-renderer/src/stage/StageOverlay';

const entry = {beatId: 'motion', motion: {phase: 'sustained', activeWindows: [{startFrame: 0, endFrame: 90}]}, reading: {startFrame: 20, endFrame: 90}} as VisualContract['beats'][number];
describe('isolated packaging motion evidence', () => {
  it.each([30, 60, 90, 96, 180])('leaves a completed-content reading hold for %i-frame scenes without freezing style clocks', duration => {
    const hold = Math.min(24, Math.ceil(duration * .4));
    expect(structureProgress(duration - hold, duration, 30, true)).toBe(1);
    expect(structureProgress(duration - 1, duration, 30, true)).toBe(1);
  });
  it('preserves legacy semantic progression', () => expect(structureProgress(36, 60, 30, false)).toBeCloseTo(36 / 59));
  it('samples the latter part of a sustained active window', () => expect(selectProofFrames(entry)).toEqual([48, 76]));
  it('samples semantic assembly within its declared interval', () => expect(selectProofFrames({...entry, motion: {...entry.motion, phase: 'semantic-completion'}})).toEqual([13, 76]));
  it('samples quiet reading separately', () => expect(selectProofFrames({...entry, motion: {...entry.motion, phase: 'quiet-reading'}})).toEqual([30, 79]));
  it('rejects a one-frame motion claim', () => expect(() => selectProofFrames({...entry, motion: {...entry.motion, activeWindows: [{startFrame: 2, endFrame: 3}]}})).toThrow('two distinct'));
  it('measures actual RGB deltas', () => expect(compareRgb(Buffer.from([0, 0, 0, 8, 8, 8]), Buffer.from([3, 3, 3, 8, 8, 8]))).toEqual({changedPixels: 1, meanChannelDelta: 1.5}));
  it.each([[Buffer.alloc(0), Buffer.alloc(0)], [Buffer.alloc(3), Buffer.alloc(6)], [Buffer.alloc(4), Buffer.alloc(4)]])('rejects malformed RGB buffers', (a, b) => expect(() => compareRgb(a, b)).toThrow('RGB24'));
  it('blocks frozen graphics instead of accepting moving source video', () => expect(() => assertMotionDelta(entry, compareRgb(Buffer.alloc(9), Buffer.alloc(9)))).toThrow('Frozen packaging'));
  it('permits a specifically declared quiet reading hold', () => expect(assertMotionDelta({...entry, motion: {...entry.motion, phase: 'quiet-reading'}}, {changedPixels: 0, meanChannelDelta: 0})).toBe('quiet-reading-reviewed-separately'));
  it('reports detected motion without claiming visual quality', () => expect(assertMotionDelta(entry, {changedPixels: 10, meanChannelDelta: .5})).toBe('motion-detected'));
});
