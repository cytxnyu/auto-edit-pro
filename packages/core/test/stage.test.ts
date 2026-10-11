import {describe, expect, it} from 'vitest';
import {planStoryboard} from '../src/planner';
import {StoryboardSchema, type Stage, type Storyboard} from '../src/schema';
import {validateDirectorPlan} from '../src/director-validation';
import {resolvePresentationMode} from '../src/presentation-contracts';
import {gateABrief, storyboardMarkdown} from '../src/reports';
const probe = {duration: 4, size: 100, video: {codec: 'h264', width: 1920, height: 1080, fps: 30}, audio: null};
const input = {id: 'stage-fixture', title: 'Fixture', probe, cues: [{index: 1, start: 0, end: 2, text: '点击确认，进入下一步'}, {index: 2, start: 2, end: 4, text: '输入素材，生成视频，人再反馈修正'}], sourceVideo: 'input.mp4', captionsMode: 'burned-in' as const};
const basicStage: Stage = {x: .1, y: .1, width: .8, height: .68, depth: 'front', surface: 'template'};
const fixture = (): Storyboard => planStoryboard({...input, presentation: 'legacy'});
const staged = (): Storyboard => {const sb = fixture(); sb.presentation = 'whole-screen-stage'; sb.beats[0].stage = structuredClone(basicStage); return sb;};

describe('additive whole-screen stage with explicit legacy aesthetic', () => {
  it('preserves original palettes, templates, copy, motions, placement and cue timing in legacy style mode', () => {
    const legacy = fixture(); const next = planStoryboard({...input, styleMix: 'legacy'});
    const withoutStage = {...next}; delete withoutStage.presentation;
    withoutStage.beats = next.beats.map((b) => {const copy = {...b}; delete copy.stage; return copy;});
    expect(withoutStage).toEqual(legacy);
    expect(next.presentation).toBe('whole-screen-stage');
    expect(next.beats.every((b) => b.stage && b.stage.width > .65)).toBe(true);
    expect(next.beats[0].stage).not.toEqual(next.beats[1].stage);
  });
  it('does not invent a subject cutout, observed gesture, or subtitle cover in automatic plans', () => {
    const next = planStoryboard(input); expect(next.source.subject).toBeUndefined();
    for (const b of next.beats) {expect(b.stage?.interaction).toBe('speech'); expect(b.stage?.gesture).toBeUndefined(); expect(b.stage?.coverSubtitles).toBe(false); expect(b.stage?.depth).toBe('front');}
  });
  it('reads old saved V2 storyboards without adding stage fields', () => {
    const sb = fixture(); expect(StoryboardSchema.parse(sb)).toEqual(sb); expect(sb.presentation).toBeUndefined(); expect(sb.beats.every((b) => !b.stage)).toBe(true);
  });
  it('allows any position, large scale, rotation and translucency for configured beats', () => {
    const sb = staged(); Object.assign(sb.beats[0].stage!, {x: -2, y: 1.8, width: 4, height: 10, scale: 12, rotation: 450, opacity: .25, surfaceOpacity: .3});
    expect(() => StoryboardSchema.parse(sb)).not.toThrow();
  });
  it('retains valid numeric geometry and opacity bounds', () => {
    const sb = staged(); sb.beats[0].stage!.width = 0; expect(() => StoryboardSchema.parse(sb)).toThrow();
    sb.beats[0].stage!.width = 1; sb.beats[0].stage!.opacity = 1.1; expect(() => StoryboardSchema.parse(sb)).toThrow();
  });
  it('resolves stage only when the beat opts in; legacy full-screen remains legacy', () => {
    expect(resolvePresentationMode('signal-route', 'left', basicStage)).toBe('whole-screen-stage');
    expect(resolvePresentationMode('signal-route', 'left')).toBe('opaque-full-screen');
    expect(resolvePresentationMode('command-palette', 'left')).toBe('presenter-safe');
  });
  it('releases full-screen role and same-side restrictions only for stage-configured beats', () => {
    const sb = fixture(); sb.beats[0].directorRole = 'definition'; sb.beats[0].placement = 'full';
    expect(validateDirectorPlan(sb).map((v) => v.code)).toContain('invalid-full-screen-role');
    sb.beats[0].stage = structuredClone(basicStage);
    expect(validateDirectorPlan(sb).map((v) => v.code)).not.toContain('invalid-full-screen-role');
    sb.beats[1].structure = sb.beats[0].structure; sb.beats[1].content = structuredClone(sb.beats[0].content);
    sb.beats[0].placement = sb.beats[1].placement = 'left'; delete sb.beats[0].stage;
    expect(validateDirectorPlan(sb).map((v) => v.code)).toContain('side-repeat');
    sb.beats[1].stage = structuredClone(basicStage);
    expect(validateDirectorPlan(sb).map((v) => v.code)).not.toContain('side-repeat');
  });
  it('releases forced opaque presentation but not missing evidence or content contracts', () => {
    const sb = staged(); sb.beats[1].placement = 'left';
    expect(validateDirectorPlan(sb).map((v) => v.code)).toContain('presentation-mode-mismatch');
    sb.beats[1].stage = structuredClone(basicStage);
    expect(validateDirectorPlan(sb).map((v) => v.code)).not.toContain('presentation-mode-mismatch');
    sb.beats[1].structure = 'evidence-panel';
    expect(validateDirectorPlan(sb).map((v) => v.code)).toEqual(expect.arrayContaining(['evidence-missing', 'content-contract']));
  });
  it('keeps original nonoverlap and six-second timing rules for stage', () => {
    const sb = staged(); sb.beats[1].start = 1; expect(() => StoryboardSchema.parse(sb)).toThrow(/overlap/);
    sb.beats = [sb.beats[0]]; sb.duration = 10; sb.beats[0].end = 6.1; expect(() => StoryboardSchema.parse(sb)).toThrow(/six seconds/);
  });
});

describe('honest person-depth and gesture contracts', () => {
  it('requires real aligned PNG sequence metadata for behind-subject depth', () => {
    const sb = staged(); sb.beats[0].stage!.depth = 'behind-subject';
    expect(() => StoryboardSchema.parse(sb)).toThrow(/transparent subject PNG/);
    sb.source.subject = {type: 'png-sequence', pattern: 'subject/frame-{frame}.png', frameCount: 120};
    expect(() => StoryboardSchema.parse(sb)).not.toThrow();
    sb.source.subject.frameCount = 60; expect(() => StoryboardSchema.parse(sb)).toThrow(/full source frame span/);
  });
  it.each(['input.mp4', 'subject/frame.png', '../subject/{frame}.png', 'C:/subject/{frame}.png', 'https://host/{frame}.png'])('rejects a nonlocal/nonsequence or nonPNG subject pattern %s', (pattern) => {
    const sb = staged(); sb.source.subject = {type: 'png-sequence', pattern, frameCount: 120}; expect(() => StoryboardSchema.parse(sb)).toThrow(/transparent PNG sequence/);
  });
  it('also requires a cutout when a depth keyframe switches behind the person', () => {
    const sb = staged(); sb.beats[0].stage!.keyframes = [{frame: 15, depth: 'behind-subject'}]; expect(() => StoryboardSchema.parse(sb)).toThrow(/transparent subject PNG/);
  });
  it('requires observed source frames and a description instead of invented gesture intent', () => {
    const sb = staged(); sb.beats[0].stage!.interaction = 'gesture'; expect(() => StoryboardSchema.parse(sb)).toThrow(/actual source observation/);
    sb.beats[0].stage!.gesture = {observedFrames: [10, 20], description: 'TEST FIXTURE observation description, not a claim about customer footage'};
    expect(() => StoryboardSchema.parse(sb)).not.toThrow();
    sb.beats[0].stage!.gesture!.observedFrames = [60]; expect(() => StoryboardSchema.parse(sb)).toThrow(/within this beat/);
  });
  it('keeps frame keyframes ordered and within the beat-local span', () => {
    const sb = staged(); sb.beats[0].stage!.keyframes = [{frame: 10, x: .2}, {frame: 5, x: .3}]; expect(() => StoryboardSchema.parse(sb)).toThrow(/strictly increasing/);
    sb.beats[0].stage!.keyframes = [{frame: 60, x: .2}]; expect(() => StoryboardSchema.parse(sb)).toThrow(/exceeds beat-local/);
    sb.beats[0].stage!.keyframes = [{frame: 59, x: .2}]; expect(() => StoryboardSchema.parse(sb)).not.toThrow();
  });
});

describe('explicit subtitle-cover keyword continuity', () => {
  it('requires handoff windows when intentional subtitle cover is enabled', () => {
    const sb = staged(); sb.beats[0].stage!.coverSubtitles = true; expect(() => StoryboardSchema.parse(sb)).toThrow(/source-keyword handoff/);
    sb.beats[0].stage!.captionHandoffs = [{startFrame: 10, endFrame: 20, keyword: '确认', x: .5, y: .2}]; expect(() => StoryboardSchema.parse(sb)).not.toThrow();
  });
  it('rejects unsupported keywords, out-of-beat or overlapping handoff windows', () => {
    const sb = staged(); sb.beats[0].stage!.coverSubtitles = true;
    sb.beats[0].stage!.captionHandoffs = [{startFrame: 10, endFrame: 20, keyword: '凭空编造', x: .5, y: .2}]; expect(() => StoryboardSchema.parse(sb)).toThrow(/source beat text/);
    sb.beats[0].stage!.captionHandoffs[0] = {startFrame: 50, endFrame: 70, keyword: '确认', x: .5, y: .2}; expect(() => StoryboardSchema.parse(sb)).toThrow(/beat-local interval/);
    sb.beats[0].stage!.captionHandoffs = [{startFrame: 10, endFrame: 20, keyword: '确认', x: .5, y: .2}, {startFrame: 19, endFrame: 30, keyword: '下一步', x: .5, y: .2}]; expect(() => StoryboardSchema.parse(sb)).toThrow(/must not overlap/);
  });
  it('surfaces stage mode and absent real subject/gesture data honestly in Gate A documents', () => {
    const sb = planStoryboard(input); const brief = gateABrief({storyboard: sb, probe, cues: input.cues});
    expect(brief).toContain('whole-screen-stage'); expect(brief).toContain('not supplied'); expect(brief).toContain('0 beats; speech-only');
    expect(storyboardMarkdown(sb)).toContain('stage x=');
  });
});
