import {describe, expect, it} from 'vitest';
import {planStoryboard} from '../packages/core/src/planner';
import {StoryboardSchema} from '../packages/core/src/schema';
import {analyzeVisualContract, assertVisualContract, createVisualContractTemplate, VisualContractSchema} from '../packages/core/src/visual-contract';
import {readyVisualContractForTest} from './fixtures/visual-contract';

const board = (count = 3) => planStoryboard({id: 'visual-contract-test', title: 'Synthetic visual contract', sourceVideo: 'source.mp4', captionsMode: 'none', styleSeed: 29,
  cues: Array.from({length: count}, (_, index) => ({index: index + 1, start: index * 3, end: (index + 1) * 3, text: ['为什么总要重复操作', '输入素材然后生成结果', '首先检查方案再确认'][index % 3]})),
  probe: {duration: count * 3, size: 1000, video: {codec: 'h264', width: 1920, height: 1080, fps: 30}, audio: {codec: 'aac', sampleRate: 48000, channels: 2}},
});
const codes = (value: ReturnType<typeof board>, contract: unknown) => analyzeVisualContract(value, contract).issues.map(issue => issue.code);

describe('enforced visual contract', () => {
  it('blocks old readable reused styles and contract duplicates from a new execution', () => {
    const value = board(); delete value.styleMix!.usage;
    value.beats[2].visualStyle = value.beats[0].visualStyle; value.beats[2].palette = value.beats[0].palette;
    expect(() => StoryboardSchema.parse(value)).not.toThrow();
    const contract = readyVisualContractForTest(value);
    expect(codes(value, contract)).toEqual(expect.arrayContaining(['single-use-style', 'single-use-contract-style']));
    expect(() => assertVisualContract(value, contract)).toThrow(/single-use/);
  });
  it('accepts an auditable mixed-style plan without requiring all 71 styles on screen', () => {
    const value = board(); const contract = readyVisualContractForTest(value);
    expect(value.styleMix!.pool).toHaveLength(71);
    expect(value.beats).toHaveLength(3);
    expect(assertVisualContract(value, contract)).toEqual(contract);
  });
  it('keeps legacy storyboard parsing compatible but requires explicit user legacy policy for new execution', () => {
    const value = board(); delete value.styleMix; delete value.presentation; value.beats.forEach(beat => {delete beat.visualStyle;});
    expect(StoryboardSchema.safeParse(value).success).toBe(true);
    const contract = readyVisualContractForTest(value);
    expect(() => assertVisualContract(value, contract)).not.toThrow();
    contract.exceptions = [];
    expect(codes(value, contract)).toContain('unapproved-style-policy');
  });
  it('preserves short real exception confirmations without padding or inventing user words', () => {
    const value = board(); value.styleMix!.pool = [...new Set(value.beats.map(beat => beat.visualStyle!.id))];
    const contract = readyVisualContractForTest(value);
    contract.exceptions[0].userRequest.quote = '可以';
    expect(() => assertVisualContract(value, contract)).not.toThrow();
    contract.exceptions[0].userRequest.quote = '   ';
    expect(codes(value, contract)).toContain('contract-schema');
  });
  it('leaves generated templates explicitly incomplete and rejects blank self-certification', () => {
    const value = board();
    expect(VisualContractSchema.safeParse(createVisualContractTemplate(value)).success).toBe(false);
    const contract = readyVisualContractForTest(value);
    contract.beats[0].visibleFeature.description = '        ';
    expect(codes(value, contract)).toContain('contract-schema');
    for (const token of ['to' + 'do', 't' + 'bd', 'place' + 'holder']) {
      contract.beats[0].visibleFeature.description = `${token.toUpperCase()}........`;
      expect(codes(value, contract)).toContain('contract-schema');
    }
  });
  it('rejects omitted beats, extra beats, duplicate IDs, unknown assets and mismatched style assignments', () => {
    const value = board(); const missing = readyVisualContractForTest(value); missing.beats.pop();
    expect(codes(value, missing)).toContain('missing-beat');
    const extra = readyVisualContractForTest(value); extra.beats.push({...extra.beats[0], beatId: 'unknown'});
    expect(codes(value, extra)).toContain('unknown-beat');
    const duplicate = readyVisualContractForTest(value); duplicate.beats.push(duplicate.beats[0]);
    expect(codes(value, duplicate)).toContain('duplicate-beat');
    const unknown = readyVisualContractForTest(value); unknown.beats[0].assetIds.push('invisible-card');
    expect(codes(value, unknown)).toContain('unknown-asset');
    const mismatch = readyVisualContractForTest(value); mismatch.beats[0].styleId = 'legacy';
    expect(codes(value, mismatch)).toContain('style-binding');
  });
  it('rejects silent custom pools and accepts a scope-bound explicit user request', () => {
    const value = board(); value.styleMix!.pool = [...new Set(value.beats.map(beat => beat.visualStyle!.id))];
    const contract = readyVisualContractForTest(value);
    expect(() => assertVisualContract(value, contract)).not.toThrow();
    contract.exceptions[0].beatIds.pop();
    expect(codes(value, contract)).toContain('unapproved-style-policy');
    contract.stylePolicy = {mode: 'default-71'};
    expect(codes(value, contract)).toContain('default-style-pool');
  });
  it('regresses the old failure: .2 intensity + identical cards + global .9-second freeze is rejected', () => {
    const value = board(6); value.beats.forEach(beat => {beat.visualStyle!.intensity = .2;});
    const contract = readyVisualContractForTest(value);
    contract.beats.forEach(entry => {
      entry.visibleFeature = structuredClone(contract.beats[0].visibleFeature);
      entry.motion.mechanism = 'fade'; entry.motion.phase = 'sustained'; entry.motion.activeWindows = [{startFrame: 0, endFrame: 27}];
    });
    expect(codes(value, contract)).toEqual(expect.arrayContaining(['low-style-intensity', 'decorative-motion-missing', 'premature-motion-freeze', 'repeated-visual-treatment']));
  });
  it('rejects authored static cards, including baked-in cards, without an explicit per-asset exception', () => {
    const value = board(); const contract = readyVisualContractForTest(value);
    contract.sourceAudit.videoKind = 'precomposed'; contract.sourceAudit.embeddedGraphicsAssetIds = ['card'];
    contract.assets.push({id: 'card', path: 'prompt-card.png', kind: 'authored-static-card', sourceRef: 'Authored prompt card composited before packaging.', usage: [{start: 0, end: 3}]});
    expect(codes(value, contract)).toContain('unapproved-static-card');
    contract.assets.at(-1)!.exceptionId = 'card-approved';
    contract.exceptions.push({id: 'card-approved', kind: 'static-card', beatIds: [value.beats[0].id], reason: 'User explicitly requested this one held prompt screenshot.', userRequest: {quote: 'Keep this exact authored prompt card static for the first scene.', evidenceRef: 'user-turn:synthetic-test'}});
    expect(() => assertVisualContract(value, contract)).not.toThrow();
    contract.assets.push({...contract.assets.at(-1)!, id: 'second-card', path: 'second-card.png'});
    expect(codes(value, contract)).toContain('static-card-exception-reuse');
    contract.assets.pop();
    contract.sourceAudit.embeddedGraphicsAssetIds = ['source-video'];
    expect(codes(value, contract)).toContain('embedded-inventory');
  });
  it('permits a short source-data reading beat at low intensity with concrete rationale', () => {
    const value = board(1); value.beats[0].directorRole = 'data'; value.beats[0].visualStyle!.intensity = .25;
    const contract = readyVisualContractForTest(value); contract.beats[0].motion.mechanism = 'none'; contract.beats[0].motion.phase = 'quiet-reading'; contract.beats[0].motion.activeWindows = [];
    expect(() => assertVisualContract(value, contract)).not.toThrow();
    delete contract.beats[0].lowIntensityReason;
    expect(codes(value, contract)).toContain('low-style-intensity');
  });
  it('requires true stable reading time and catches moving parent transforms', () => {
    const value = board(); const contract = readyVisualContractForTest(value);
    contract.beats[0].reading.endFrame = contract.beats[0].reading.startFrame + 1;
    expect(codes(value, contract)).toContain('reading-window');
    const good = readyVisualContractForTest(value); value.beats[0].stage!.keyframes = [{frame: 0, x: 0}, {frame: 89, x: .5}];
    expect(codes(value, good)).toContain('reading-transform');
  });
  it('rejects a global freeze field, malformed active ranges, offscreen signatures and hidden stages', () => {
    const value = board(); const contract = readyVisualContractForTest(value);
    expect(codes(value, {...contract, globalFreezeAt: .9})).toContain('contract-schema');
    contract.beats[0].motion.activeWindows = [{startFrame: 40, endFrame: 20}];
    contract.beats[1].visibleFeature.region.x = 2;
    value.beats[2].stage!.opacity = .1;
    expect(codes(value, contract)).toEqual(expect.arrayContaining(['motion-window', 'offscreen-feature', 'hidden-style']));
  });
  it('inventories actual evidence separately from authored graphics', () => {
    const value = board(1); value.beats[0].evidence = {src: 'real-screen.png', label: 'Actual source screenshot'};
    const contract = readyVisualContractForTest(value);
    expect(() => assertVisualContract(value, contract)).not.toThrow();
    contract.assets.at(-1)!.kind = 'authored-graphic';
    expect(codes(value, contract)).toContain('evidence-inventory');
  });
});
