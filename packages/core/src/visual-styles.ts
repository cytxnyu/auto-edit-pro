import {CATALOG_STYLE_IDS} from './catalog-styles';
import {z} from 'zod';

// Independent of schema.ts so renderer, planner and validation share one contract.
export const VISUAL_STYLE_IDS = [
  'balatro', 'crt-warp', 'cubes', 'hyperspeed',
  'shape-waves', 'ripple-distortion', 'evil-eye', 'electric-border', 'lightning',
  'grid-motion', 'waves', 'metallic-paint', 'circular-carousel', 'micro-slats',
  'ghost-fibers', 'acid-squares', 'light-tunnel', 'light-pillar', 'floating-lines',
  'grid-scan', 'prismatic-burst',
  ...CATALOG_STYLE_IDS,
] as const;
export type VisualStyleId = (typeof VISUAL_STYLE_IDS)[number];
const uint32 = z.number().int().min(0).max(0xffffffff);
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export const VisualStyleSchema = z.object({
  id: z.enum(VISUAL_STYLE_IDS),
  seed: uint32,
  intensity: z.number().min(0).max(1),
  colors: z.tuple([hex, hex, hex]).optional(),
}).strict();
export const StyleMixSchema = z.object({
  mode: z.literal('seeded-shuffle'),
  // Omitted only on saved pre-0.7 boards. New plans always declare single-use.
  usage: z.literal('single-use').optional(),
  seed: uint32,
  pool: z.array(z.enum(VISUAL_STYLE_IDS)).min(1).max(VISUAL_STYLE_IDS.length)
    .refine((pool) => new Set(pool).size === pool.length, 'Style pool must contain unique style IDs'),
}).strict();
export type VisualStyle = z.infer<typeof VisualStyleSchema>;
export type StyleMix = z.infer<typeof StyleMixSchema>;
export type StyleOptions = {styleMix?: 'seeded-shuffle' | 'legacy'; styleSeed?: number; stylePool?: VisualStyleId[]};

export const validateStyleOptions = (options: StyleOptions): void => {
  z.object({styleMix: z.enum(['seeded-shuffle', 'legacy']).optional(), styleSeed: uint32.optional(), stylePool: StyleMixSchema.shape.pool.optional()}).parse(options);
  if (options.styleMix === 'legacy' && (options.styleSeed !== undefined || options.stylePool !== undefined)) {
    throw new Error('Legacy style mode does not accept --style-seed or --style-pool');
  }
};

// FNV-1a is stable across platforms; no current time, runtime random or frame state.
export const deriveStyleSeed = (id: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) hash = Math.imul(hash ^ id.charCodeAt(index), 0x01000193) >>> 0;
  return hash;
};

export const seededStyleAssignments = (count: number, config: StyleMix): VisualStyleId[] => {
  StyleMixSchema.parse(config);
  if (!Number.isInteger(count) || count < 0) throw new Error('Style assignment count must be a nonnegative integer');
  if (count > config.pool.length) throw new Error(`Single-use style pool exhausted: ${count} scenes require ${count} distinct styles, but the pool has ${config.pool.length}. Reduce nonessential scenes or first register and test additional styles; never recycle the pool.`);
  let state = config.seed;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), state | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
  const bag = [...config.pool];
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [bag[index], bag[swap]] = [bag[swap], bag[index]];
  }
  return bag.slice(0, count);
};

/** Inspect raw declarations before a schema can discard unknown nested fields. */
export const nestedStyleDeclarations = (value: unknown, path: Array<string | number> = []): Array<Array<string | number>> => {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => nestedStyleDeclarations(item, [...path, index]));
  return Object.entries(value).flatMap(([key, item]) => {
    const next = [...path, key];
    if (/^(visualStyles?|styleMix|styleIds?|styles|backgroundStyle|componentStyle)$/i.test(key)) return [next];
    return nestedStyleDeclarations(item, next);
  });
};

type SingleStyleBoard = {fps: number; styleMix?: StyleMix; beats: Array<{id: string; start: number; end: number; palette: string; visualStyle?: VisualStyle}>};
/** Execution check, including old readable boards whose usage flag is absent.
 * Legacy exceptions are validated by the visual contract, never by a CLI flag. */
export const assertSingleUseStyles = (board: SingleStyleBoard): void => {
  if (!board.styleMix) throw new Error('Single-use execution requires a saved style pool and exactly one visualStyle per scene');
  StyleMixSchema.parse(board.styleMix);
  const seen = new Set<string>();
  let previousEnd = 0;
  for (const beat of board.beats) {
    if (!beat.visualStyle) throw new Error(`Single-use scene ${beat.id} requires exactly one visualStyle`);
    const style = VisualStyleSchema.parse(beat.visualStyle);
    if (!board.styleMix.pool.includes(style.id)) throw new Error(`Style ${style.id} is outside the saved pool`);
    if (seen.has(style.id)) throw new Error(`Single-use style ${style.id} repeats in scene ${beat.id}; each style may appear only once in the entire video`);
    if (beat.palette !== style.id) throw new Error(`Scene ${beat.id} palette must match its single visualStyle; do not combine another style palette`);
    const start = Math.round(beat.start * board.fps);
    const end = start + Math.max(1, Math.round((beat.end - beat.start) * board.fps));
    if (start < previousEnd) throw new Error(`Scene ${beat.id} overlaps the previous scene at rendered frames; simultaneous style layers are forbidden`);
    seen.add(style.id); previousEnd = end;
  }
};

export const parseStyleCliOptions = (args: Record<string, string | boolean>): StyleOptions => {
  const options: StyleOptions = {};
  if (args['style-mix'] !== undefined) {
    if (args['style-mix'] !== 'seeded-shuffle' && args['style-mix'] !== 'legacy') throw new Error('Invalid --style-mix; expected seeded-shuffle or legacy');
    options.styleMix = args['style-mix'];
  }
  if (args['style-seed'] !== undefined) {
    const raw = args['style-seed'];
    if (typeof raw !== 'string' || !/^\d+$/.test(raw) || Number(raw) > 0xffffffff) throw new Error('Invalid --style-seed; expected an integer from 0 to 4294967295');
    options.styleSeed = Number(raw);
  }
  if (args['style-pool'] !== undefined) {
    const raw = args['style-pool'];
    if (typeof raw !== 'string') throw new Error('Invalid --style-pool; expected comma-separated style IDs');
    options.stylePool = raw.split(',').map((id) => id.trim()) as VisualStyleId[];
  }
  validateStyleOptions(options);
  return options;
};
