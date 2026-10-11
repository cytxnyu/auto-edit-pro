import {describe, expect, it} from 'vitest';
import {planStoryboard} from '../src/planner';
import {StoryboardSchema} from '../src/schema';
import {PALETTES, PALETTE_IDS} from '../src/palettes';
import {gateABrief, storyboardMarkdown} from '../src/reports';
import {assertSingleUseStyles, deriveStyleSeed, parseStyleCliOptions, seededStyleAssignments, StyleMixSchema, VisualStyleSchema, VISUAL_STYLE_IDS} from '../src/visual-styles';

const probe = {duration: 24, size: 100, video: {codec: 'h264', width: 1920, height: 1080, fps: 30}, audio: null};
const phrases = ['为什么一直要重复操作', '首先读取素材，然后分析，再生成方案，最后确认', '运行检查、审核方案、确认导出', '输入素材，AI生成视频，人再反馈修正'];
const input = {id: 'visual-style-fixture', title: 'Fixture', probe, cues: Array.from({length: 12}, (_, index) => ({index: index + 1, start: index * 2, end: (index + 1) * 2, text: phrases[index % phrases.length]})), sourceVideo: 'input.mp4', captionsMode: 'burned-in' as const};

describe('seeded visual style planner', () => {
  it('uses exactly one reproducible 71-style bag, globally without replacement', () => {
    expect(VISUAL_STYLE_IDS).toHaveLength(71);
    const count = VISUAL_STYLE_IDS.length;
    for (const seed of [0, 1, 29, 0xffffffff]) {
      const config = {mode: 'seeded-shuffle' as const, seed, pool: [...VISUAL_STYLE_IDS]};
      const assignments = seededStyleAssignments(count, config);
      expect(assignments).toEqual(seededStyleAssignments(count, config));
      for (let i = 0; i < assignments.length; i += VISUAL_STYLE_IDS.length) expect(new Set(assignments.slice(i, i + VISUAL_STYLE_IDS.length))).toEqual(new Set(VISUAL_STYLE_IDS));
      expect(assignments.every((style, i) => i === 0 || style !== assignments[i - 1])).toBe(true);
      expect(new Set(assignments).size).toBe(count);
      expect(() => seededStyleAssignments(count + 1, config)).toThrow(/pool exhausted/);
    }
  });
  it('does not add meaningless beats to exhaust a larger default pool', () => {
    const short = planStoryboard({...input, cues: input.cues.slice(0, 2), probe: {...probe, duration: 4}});
    expect(short.beats).toHaveLength(2);
    expect(short.styleMix?.pool).toHaveLength(71);
    expect(short.beats.every(b => b.visualStyle && short.styleMix!.pool.includes(b.visualStyle.id))).toBe(true);
  });
  it('preserves the original four-style explicit pool and its saved seed sequence', () => {
    const pool = ['balatro', 'crt-warp', 'cubes', 'hyperspeed'] as const;
    const board = planStoryboard({...input, cues: input.cues.slice(0, 4), styleSeed: 29, stylePool: [...pool]});
    expect(seededStyleAssignments(4, {mode: 'seeded-shuffle', seed: 29, pool: [...pool]})).toEqual(['crt-warp', 'cubes', 'hyperspeed', 'balatro']);
    expect(() => planStoryboard({...input, styleSeed: 29, stylePool: [...pool]})).toThrow(/never recycle/);
    expect(board.styleMix?.pool).toEqual(pool);
    expect(new Set(board.beats.slice(0, 4).map(b => b.visualStyle!.id))).toEqual(new Set(pool));
    expect(StoryboardSchema.parse(JSON.parse(JSON.stringify(board)))).toEqual(board);
    expect(board.beats.every(b => pool.includes(b.visualStyle!.id as typeof pool[number]))).toBe(true);
  });
  it('supports subsets and a one-style pool only within their unique capacity', () => {
    expect(seededStyleAssignments(1, {mode: 'seeded-shuffle', seed: 0, pool: ['cubes']})).toEqual(['cubes']);
    expect(() => seededStyleAssignments(2, {mode: 'seeded-shuffle', seed: 0, pool: ['cubes']})).toThrow(/Reduce nonessential scenes/);
    const pair = seededStyleAssignments(2, {mode: 'seeded-shuffle', seed: 4, pool: ['cubes', 'balatro']});
    expect(pair.every((style, i) => i === 0 || style !== pair[i - 1])).toBe(true);
  });
  it('rejects nonadjacent repeats, mixed palettes, and overlapping rendered frames', () => {
    const base = planStoryboard(input);
    expect(base.styleMix?.usage).toBe('single-use');
    expect(() => assertSingleUseStyles(base)).not.toThrow();
    const duplicate = structuredClone(base); duplicate.beats[2].visualStyle = duplicate.beats[0].visualStyle; duplicate.beats[2].palette = duplicate.beats[0].palette;
    expect(() => StoryboardSchema.parse(duplicate)).toThrow(/repeats/);
    delete duplicate.styleMix!.usage;
    expect(() => StoryboardSchema.parse(duplicate)).not.toThrow(); // read compatibility only
    expect(() => assertSingleUseStyles(duplicate)).toThrow(/repeats/); // new execution still blocked
    const palette = structuredClone(base); palette.beats[0].palette = 'deep-ocean';
    expect(() => StoryboardSchema.parse(palette)).toThrow(/palette must match/);
    const overlap = structuredClone(base); overlap.beats[1].start = overlap.beats[0].end - 0.01;
    expect(() => StoryboardSchema.parse(overlap)).toThrow(/overlap/);
    // Nonoverlapping seconds may still overlap after Remotion frame rounding.
    const rounded = structuredClone(base); rounded.beats[0].start = .02; rounded.beats[0].end = 2.04; rounded.beats[1].start = 2.04;
    expect(() => assertSingleUseStyles(rounded)).toThrow(/rendered frames/);
  });
  it('enforces one scene style and rejects hidden nested style declarations', () => {
    for (const mutate of [
      (b: any) => {b.beats[0].visualStyle = [b.beats[0].visualStyle, b.beats[1].visualStyle];},
      (b: any) => {b.beats[0].content.componentStyle = 'cubes';},
      (b: any) => {b.beats[0].stage.visualStyle = {id: 'cubes'};},
      (b: any) => {b.beats[0].visualStyles = ['cubes', 'balatro'];},
      (b: any) => {b.beats[0].content.layers = [{styleId: 'cubes'}];},
      (b: any) => {delete b.beats[0].visualStyle;},
    ]) {
      const b = planStoryboard(input); mutate(b); expect(() => StoryboardSchema.parse(b)).toThrow();
    }
  });
  it('persists the input-derived seed by default and changes visuals for a different seed', () => {
    const first = planStoryboard(input);
    expect(first).toEqual(planStoryboard(input));
    expect(first.styleMix?.seed).toBe(deriveStyleSeed(input.id));
    expect(first.styleMix?.pool).toEqual(VISUAL_STYLE_IDS);
    const second = planStoryboard({...input, styleSeed: 123});
    expect(first.beats.map((b) => b.visualStyle)).not.toEqual(second.beats.map((b) => b.visualStyle));
    expect(first.beats.every((b) => b.palette === b.visualStyle?.id)).toBe(true);
    expect(first.beats.every((b) => b.stage !== undefined)).toBe(true);
    const semantics = (board: typeof first) => board.beats.map(({visualStyle, palette, ...beat}) => beat);
    expect(semantics(first)).toEqual(semantics(second));
    expect(semantics(first)).toEqual(semantics(planStoryboard({...input, styleMix: 'legacy'})));
  });
  it('lowers background intensity for evidence and data', () => {
    const board = planStoryboard({...input, cues: [{index: 1, start: 0, end: 2, text: '这里引用官方文档作为证据'}, {index: 2, start: 2, end: 4, text: '我只消耗了3%的额度'}], evidenceByCue: {1: {src: 'real.png', label: '官方截图'}}});
    expect(board.beats.map((b) => b.visualStyle?.intensity)).toEqual([.25, .25]);
  });
  it('keeps old JSON and legacy presentation without adding visual fields', () => {
    const board = planStoryboard({...input, presentation: 'legacy'});
    expect(board.styleMix).toBeUndefined();
    expect(board.beats.every((b) => !b.visualStyle && !b.stage)).toBe(true);
    expect(StoryboardSchema.parse(JSON.parse(JSON.stringify(board)))).toEqual(board);
    expect(planStoryboard({...input, styleMix: 'legacy'}).beats[0].palette).toBe(board.beats[0].palette);
  });
  it('rejects invalid mix data and render parameters', () => {
    for (const seed of [-1, 1.5, 4294967296, NaN]) expect(() => planStoryboard({...input, styleSeed: seed})).toThrow();
    expect(() => StyleMixSchema.parse({mode: 'seeded-shuffle', seed: 1, pool: []})).toThrow();
    expect(() => StyleMixSchema.parse({mode: 'seeded-shuffle', seed: 1, pool: ['cubes', 'cubes']})).toThrow();
    expect(() => planStoryboard({...input, presentation: 'legacy', styleSeed: 1})).toThrow(/whole-screen-stage/);
    expect(() => planStoryboard({...input, styleMix: 'legacy', stylePool: ['cubes']})).toThrow(/Legacy/);
    for (const intensity of [-.1, 1.1]) expect(() => VisualStyleSchema.parse({id: 'cubes', seed: 0, intensity})).toThrow();
    expect(() => VisualStyleSchema.parse({id: 'cubes', seed: 0, intensity: .5, colors: ['red', '#ffffff', '#000000']})).toThrow();
    const board = planStoryboard(input);
    delete board.beats[0].stage;
    expect(() => StoryboardSchema.parse(board)).toThrow(/stage envelope/);
    board.beats[0].stage = planStoryboard(input).beats[0].stage;
    board.styleMix!.pool = ['cubes'];
    expect(() => StoryboardSchema.parse(board)).toThrow(/saved pool/);
  });
  it('records pool and seed in Gate A brief and style details per storyboard beat', () => {
    const storyboard = planStoryboard({...input, styleSeed: 29});
    expect(gateABrief({storyboard, probe, cues: input.cues})).toContain(`seeded-shuffle; seed=29; pool=${VISUAL_STYLE_IDS.join(', ')}`);
    expect(storyboardMarkdown(storyboard)).toContain(`${storyboard.beats[0].visualStyle!.id} / ${storyboard.beats[0].visualStyle!.seed}`);
  });
});

describe('registered style palettes', () => {
  const linear = (channel: number) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  const luminance = (hex: string) => {
    const c = [1, 3, 5].map(index => linear(parseInt(hex.slice(index, index + 2), 16) / 255));
    return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
  };
  const contrast = (a: string, b: string) => {const la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + .05) / (Math.min(la, lb) + .05);};
  it('retains the six legacy palettes and gives all 71 styles their own complete palette', () => {
    expect(PALETTE_IDS).toHaveLength(77);
    expect(PALETTE_IDS.slice(6)).toEqual(VISUAL_STYLE_IDS);
    expect(new Set(VISUAL_STYLE_IDS.map(id => [PALETTES[id].accent, PALETTES[id].line, PALETTES[id].canvas].join(','))).size).toBe(71);
  });
  it.each(VISUAL_STYLE_IDS.slice(4))('%s has readable semantic text surfaces and valid colors', id => {
    const palette = PALETTES[id];
    expect(palette.id).toBe(id);
    for (const value of Object.entries(palette).filter(([key]) => key !== 'id').map(([, value]) => value)) expect(value).toMatch(/^#[0-9a-f]{6}$/i);
    for (const surface of [palette.canvas, palette.surface, palette.card]) {
      expect(contrast(palette.foreground, surface)).toBeGreaterThanOrEqual(7);
      expect(contrast(palette.muted, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('style CLI options', () => {
  it('accepts explicit seed zero and subsets', () => {
    expect(parseStyleCliOptions({'style-seed': '0', 'style-pool': 'balatro, cubes'})).toEqual({styleSeed: 0, stylePool: ['balatro', 'cubes']});
  });
  it.each<Record<string, string | boolean>>([{'style-seed': true}, {'style-seed': '-1'}, {'style-seed': '1.2'}, {'style-seed': '4294967296'}, {'style-pool': 'missing'}, {'style-pool': 'cubes,cubes'}, {'style-pool': 'cubes,'}, {'style-pool': true}, {'style-mix': 'random'}, {'style-mix': 'legacy', 'style-seed': '1'}])('rejects invalid options %o', (args) => {
    expect(() => parseStyleCliOptions(args)).toThrow();
  });
});
