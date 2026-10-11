import {z} from 'zod';
import {PALETTE_IDS} from './palettes';
import {SEMANTIC_STRUCTURES, TemplateContentSchema} from './template-contracts';
import {assertSingleUseStyles, nestedStyleDeclarations, StyleMixSchema, VisualStyleSchema} from './visual-styles';

export {PALETTE_IDS} from './palettes';
export {SEMANTIC_STRUCTURES} from './template-contracts';

export const DIRECTOR_ROLES = [
  'hook',
  'definition',
  'problem',
  'contrast',
  'mechanism',
  'steps',
  'data',
  'evidence',
  'payoff',
  'cta',
  'bridge',
] as const;

export const VISUAL_STRUCTURES = SEMANTIC_STRUCTURES;

export const MOTION_PRIMITIVES = [
  'hit',
  'slide',
  'lift',
  'stamp',
  'route',
  'trace',
  'count',
  'reveal',
  'relay',
  'focus',
] as const;

export const ILLUSTRATION_SCENARIOS = [
  'information-overload',
  'climb-boulder',
  'workstation-balance',
  'paper-plane-route',
  'route-activation',
  'before-after-illustration',
] as const;

const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Expected a six-digit hex color');

// Additive presentation controls: original V2 content and legacy layouts remain unchanged.
// Geometry is normalized to the output canvas; x/y are top-left and may be off-screen.
const finite = z.number().finite();
const alpha = z.number().min(0).max(1);
const depth = z.enum(['front', 'behind-subject']);
/** Static subviewport, normalized to the stage (not the output canvas). */
export const StageRegionSchema = z.object({
  x: finite.min(0).max(1), y: finite.min(0).max(1),
  width: finite.positive().max(1), height: finite.positive().max(1),
}).strict().superRefine((region, context) => {
  if (region.x + region.width > 1) context.addIssue({code: 'custom', path: ['width'], message: 'Stage region right edge must be at most 1'});
  if (region.y + region.height > 1) context.addIssue({code: 'custom', path: ['height'], message: 'Stage region bottom edge must be at most 1'});
});
const stageKeyframeSchema = z.object({
  frame: z.number().int().min(0), // beat-local frame
  x: finite.optional(), y: finite.optional(),
  width: finite.positive().optional(), height: finite.positive().optional(),
  scale: finite.positive().optional(), rotation: finite.optional(),
  opacity: alpha.optional(), surfaceOpacity: alpha.optional(), depth: depth.optional(),
}).strict().superRefine((keyframe, context) => {
  if (Object.keys(keyframe).length < 2) context.addIssue({code: 'custom', message: 'Stage keyframe needs at least one animated property'});
});
export const StageSchema = z.object({
  x: finite, y: finite, width: finite.positive(), height: finite.positive(),
  scale: finite.positive().optional(), rotation: finite.optional(),
  opacity: alpha.optional(), surfaceOpacity: alpha.optional(),
  depth,
  surface: z.enum(['template', 'transparent', 'opaque']),
  contentRegion: StageRegionSchema.optional(),
  styleRegion: StageRegionSchema.optional(),
  keyframes: z.array(stageKeyframeSchema).optional(),
  interaction: z.enum(['speech', 'gesture']).optional(),
  gesture: z.object({
    observedFrames: z.array(z.number().int().min(0)).min(1), // source-global observations, not generated hand poses
    description: z.string().trim().min(1).max(500),
  }).optional(),
  coverSubtitles: z.boolean().optional(),
  captionHandoffs: z.array(z.object({
    startFrame: z.number().int().min(0), endFrame: z.number().int().positive(), // local [start,end)
    keyword: z.string().trim().min(1).max(24),
    x: z.number().min(0).max(1), y: z.number().min(0).max(1),
  })).optional(),
}).superRefine((stage, context) => {
  if (stage.interaction === 'gesture' && !stage.gesture) context.addIssue({code: 'custom', path: ['gesture'], message: 'Gesture interaction requires actual source observation frames and description'});
  if (stage.gesture && stage.interaction !== 'gesture') context.addIssue({code: 'custom', path: ['interaction'], message: 'Observed gesture requires interaction=gesture'});
  if (stage.coverSubtitles && !stage.captionHandoffs?.length) context.addIssue({code: 'custom', path: ['captionHandoffs'], message: 'Intentional subtitle cover requires readable source-keyword handoff windows'});
  stage.keyframes?.forEach((keyframe, index) => {
    if (index && keyframe.frame <= stage.keyframes![index - 1].frame) context.addIssue({code: 'custom', path: ['keyframes', index, 'frame'], message: 'Stage keyframes must be strictly increasing'});
  });
});

export const SubjectSequenceSchema = z.object({
  type: z.literal('png-sequence'),
  pattern: z.string().min(1).refine((value) => value.endsWith('.png') && value.split('{frame}').length === 2 && !/^[a-z]+:|^[/\\]|(?:^|[/\\])\.\.(?:[/\\]|$)/i.test(value), 'Subject must be a local transparent PNG sequence with one {frame} token (six-digit source frame)'),
  frameCount: z.number().int().positive(),
});

const beatSchema = z.preprocess((value, context) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const {visualStyle: _onePermittedStyle, ...rest} = value as Record<string, unknown>;
    for (const path of nestedStyleDeclarations(rest)) context.addIssue({code: 'custom', path, message: 'A scene has exactly one visualStyle; nested or additional styles are forbidden'});
  }
  return value;
}, z.object({
  id: z.string().min(1),
  start: z.number().min(0),
  end: z.number().positive(),
  text: z.string().min(1).max(80),
  structure: z.enum(SEMANTIC_STRUCTURES),
  content: TemplateContentSchema,
  motions: z.array(z.enum(MOTION_PRIMITIVES)).min(1).max(3),
  placement: z.enum(['left', 'right', 'full']),
  stage: StageSchema.optional(),
  palette: z.enum(PALETTE_IDS),
  visualStyle: VisualStyleSchema.optional(),
  directorRole: z.enum(DIRECTOR_ROLES),
  reason: z.string().trim().min(1).max(120).optional(),
  evidence: z
    .object({
      src: z.string().min(1),
      label: z.string().min(1),
      sourceUrl: z.string().url().optional(),
    })
    .optional(),
  illustration: z
    .object({type: z.enum(ILLUSTRATION_SCENARIOS), label: z.string().min(1).max(32)})
    .optional(),
}).strict().superRefine((beat, context) => {
  if (beat.content.structure !== beat.structure) {
    context.addIssue({
      code: 'custom',
      path: ['content', 'structure'],
      message: 'Content structure must match beat structure',
    });
  }
}));

export const StoryboardSchema = z.object({
  version: z.literal('2.0'),
  presentation: z.literal('whole-screen-stage').optional(),
  styleMix: StyleMixSchema.optional(),
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  duration: z.number().positive(),
  fps: z.number().int().min(15).max(60),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  captionsMode: z.enum(['burned-in', 'none', 'generated']),
  source: z.object({video: z.string().min(1), srt: z.string().optional(), subject: SubjectSequenceSchema.optional()}),
  theme: z.object({background: color, foreground: color, accent: color}),
  beats: z.array(beatSchema).min(1),
}).superRefine((storyboard, context) => {
  if (storyboard.styleMix?.usage === 'single-use') {
    try {assertSingleUseStyles(storyboard);} catch (error) {context.addIssue({code: 'custom', path: ['styleMix', 'usage'], message: (error as Error).message});}
  }
  const sourceFrames = Math.round(storyboard.duration * storyboard.fps);
  if (storyboard.source.subject && storyboard.source.subject.frameCount < sourceFrames) context.addIssue({code: 'custom', path: ['source', 'subject', 'frameCount'], message: 'Subject sequence must align to and cover the full source frame span'});
  storyboard.beats.forEach((beat, index) => {
    if (beat.visualStyle && !beat.stage) context.addIssue({code: 'custom', path: ['beats', index, 'visualStyle'], message: 'Visual styles require a stage envelope'});
    if (storyboard.styleMix && (!beat.visualStyle || !storyboard.styleMix.pool.includes(beat.visualStyle.id))) context.addIssue({code: 'custom', path: ['beats', index, 'visualStyle'], message: 'Every mixed-style beat must use a style from the saved pool'});
    const stage = beat.stage;
    if (stage) {
      const localFrames = Math.max(1, Math.round((beat.end - beat.start) * storyboard.fps));
      const startFrame = Math.round(beat.start * storyboard.fps);
      if ((stage.depth === 'behind-subject' || stage.keyframes?.some((k) => k.depth === 'behind-subject')) && !storyboard.source.subject) context.addIssue({code: 'custom', path: ['beats', index, 'stage', 'depth'], message: 'Behind-subject graphics require an aligned transparent subject PNG sequence, not the opaque source video'});
      stage.keyframes?.forEach((k, j) => {if (k.frame >= localFrames) context.addIssue({code: 'custom', path: ['beats', index, 'stage', 'keyframes', j], message: 'Keyframe exceeds beat-local frame interval'});});
      stage.gesture?.observedFrames.forEach((frame, j) => {if (frame < startFrame || frame >= startFrame + localFrames) context.addIssue({code: 'custom', path: ['beats', index, 'stage', 'gesture', 'observedFrames', j], message: 'Gesture observation must reference an actual source frame within this beat'});});
      stage.captionHandoffs?.forEach((handoff, j) => {
        if (handoff.endFrame <= handoff.startFrame || handoff.endFrame > localFrames) context.addIssue({code: 'custom', path: ['beats', index, 'stage', 'captionHandoffs', j], message: 'Caption handoff must be a positive beat-local interval'});
        if (!beat.text.replace(/\s+/g, '').includes(handoff.keyword.replace(/\s+/g, ''))) context.addIssue({code: 'custom', path: ['beats', index, 'stage', 'captionHandoffs', j, 'keyword'], message: 'Caption handoff keyword must be present in the source beat text'});
        if (j && handoff.startFrame < stage.captionHandoffs![j - 1].endFrame) context.addIssue({code: 'custom', path: ['beats', index, 'stage', 'captionHandoffs', j], message: 'Caption handoff windows must not overlap or be out of order'});
      });
    }
    const duration = beat.end - beat.start;
    if (duration <= 0) {
      context.addIssue({
        code: 'custom',
        path: ['beats', index, 'end'],
        message: 'Beat duration must be positive',
      });
    }
    if (duration > 6) {
      context.addIssue({
        code: 'custom',
        path: ['beats', index, 'end'],
        message: 'Beat duration cannot exceed six seconds',
      });
    }
    if (beat.end > storyboard.duration + 0.001) {
      context.addIssue({
        code: 'custom',
        path: ['beats', index, 'end'],
        message: 'Beat exceeds source duration',
      });
    }
    const previous = storyboard.beats[index - 1];
    if (previous && beat.start < previous.end) {
      context.addIssue({
        code: 'custom',
        path: ['beats', index, 'start'],
        message: 'Beats cannot overlap or be out of order',
      });
    }
  });
});

export type Storyboard = z.infer<typeof StoryboardSchema>;
export type StoryboardBeat = Storyboard['beats'][number];
export type VisualStructure = (typeof VISUAL_STRUCTURES)[number];
export type MotionPrimitive = (typeof MOTION_PRIMITIVES)[number];
export type IllustrationScenario = (typeof ILLUSTRATION_SCENARIOS)[number];
export type DirectorRole = (typeof DIRECTOR_ROLES)[number];

export type StageRegion = z.infer<typeof StageRegionSchema>;
export type Stage = z.infer<typeof StageSchema>;
export type StageKeyframe = z.infer<typeof stageKeyframeSchema>;
export type SubjectSequence = z.infer<typeof SubjectSequenceSchema>;
export type {VisualStyle, VisualStyleId, StyleMix} from './visual-styles';

