import {z} from 'zod';
import type {Storyboard} from './schema';
import {assertSingleUseStyles, VISUAL_STYLE_IDS} from './visual-styles';

// This sidecar is deliberately separate from StoryboardSchema: saved projects remain
// readable, but new execution must supply an auditable, job-specific visual plan.
const unfinishedDetail = new RegExp(`^(?:${['to' + 'do', 't' + 'bd', 'pass', 'approved', 'n\\/?a', 'none', '待填', '待补', '通过', '已检查', 'place' + 'holder'].join('|')})(?:[\\s.!。]*)$`, 'i');
const detail = z.string().trim().min(8).max(1500).refine(value => !unfinishedDetail.test(value), 'Describe a concrete observation or decision, not an unfinished stub');
const id = z.string().trim().min(1);
const frameWindow = z.object({startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive()}).strict();
const timeWindow = z.object({start: z.number().finite().nonnegative(), end: z.number().finite().positive()}).strict();
const ExceptionSchema = z.object({
  id, kind: z.enum(['custom-style-pool', 'legacy-style', 'static-card', 'quiet-motion']),
  beatIds: z.array(id), reason: detail,
  // A genuine contextual confirmation can be as short as “可以”. Preserve it
  // verbatim; require the concrete scope/reason and evidence reference elsewhere.
  userRequest: z.object({quote: z.string().trim().min(1).max(1500), evidenceRef: z.string().trim().min(3)}).strict(),
}).strict();
const AssetSchema = z.object({
  id, path: z.string().trim().min(1),
  kind: z.enum(['source-media', 'source-evidence', 'authored-graphic', 'authored-static-card']),
  sourceRef: detail, exceptionId: id.optional(), usage: z.array(timeWindow).min(1),
}).strict();
export const VisualContractSchema = z.object({
  version: z.literal('1.0'), storyboardId: id, status: z.literal('ready'),
  stylePolicy: z.object({mode: z.enum(['default-71', 'user-custom', 'user-legacy']), exceptionId: id.optional()}).strict(),
  exceptions: z.array(ExceptionSchema),
  sourceAudit: z.object({videoKind: z.enum(['raw', 'precomposed']), inspectedBy: z.string().trim().min(2), inspectionEvidence: detail, embeddedGraphicsAssetIds: z.array(id)}).strict(),
  assets: z.array(AssetSchema).min(1),
  beats: z.array(z.object({
    beatId: id, styleId: z.enum([...VISUAL_STYLE_IDS, 'legacy']),
    visibleFeature: z.object({
      family: z.enum(['geometry', 'particles', 'light-field', 'depth', 'distortion', 'scan', 'border', 'material', 'sequencing']),
      description: detail, layoutRole: detail,
      region: z.object({x: z.number().finite(), y: z.number().finite(), width: z.number().finite().positive(), height: z.number().finite().positive()}).strict(),
      startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive(),
    }).strict(),
    motion: z.object({
      mechanism: z.enum(['assembly', 'trace', 'orbit', 'parallax', 'wave', 'deform', 'carousel', 'count', 'reveal', 'route', 'lift', 'slide', 'pulse', 'none', 'fade']),
      phase: z.enum(['sustained', 'semantic-completion', 'quiet-reading']),
      activeWindows: z.array(frameWindow), decoratedProperty: detail, description: detail,
      textIndependent: z.literal(true), exceptionId: id.optional(),
    }).strict(),
    reading: z.object({startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive(), stableText: z.literal(true), description: detail}).strict(),
    assetIds: z.array(id), lowIntensityReason: detail.optional(),
  }).strict()).min(1),
}).strict();

export type VisualContract = z.infer<typeof VisualContractSchema>;
export type VisualContractIssue = {code: string; message: string; beatId?: string};
export type VisualContractAnalysis = {
  ok: boolean; issues: VisualContractIssue[]; contract?: VisualContract;
  metrics: {beats: number; styleIds: number; featureSignatures: number; motionMechanisms: number; assets: number; staticCards: number; lowIntensityBeats: number};
};
const pathKey = (value: string) => value.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
const sourceReading = (beat: Storyboard['beats'][number]) => beat.structure === 'evidence-panel' || beat.structure === 'metric-odometer' || beat.directorRole === 'evidence' || beat.directorRole === 'data';
const simpleMotion = (mechanism: string) => mechanism === 'none' || mechanism === 'fade';

/** Validates planning claims only. Actual visibility, contrast and movement must
 * still be checked against rendered frames and dynamic review evidence at Gate C. */
export const analyzeVisualContract = (storyboard: Storyboard, rawContract: unknown): VisualContractAnalysis => {
  const issues: VisualContractIssue[] = [];
  const metrics = {beats: storyboard.beats.length, styleIds: new Set(storyboard.beats.map(beat => beat.visualStyle?.id).filter(Boolean)).size, featureSignatures: 0, motionMechanisms: 0, assets: 0, staticCards: 0, lowIntensityBeats: 0};
  const add = (code: string, message: string, beatId?: string) => issues.push({code, message, ...(beatId ? {beatId} : {})});
  const parsed = VisualContractSchema.safeParse(rawContract);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) add('contract-schema', `${issue.path.join('.')}: ${issue.message}`);
    return {ok: false, issues, metrics};
  }
  const contract = parsed.data;
  if (contract.storyboardId !== storyboard.id) add('storyboard-binding', 'Contract must name this exact storyboard');
  const boardIds = new Set(storyboard.beats.map(beat => beat.id));
  if (boardIds.size !== storyboard.beats.length) add('duplicate-storyboard-beat', 'Storyboard beat IDs must be unique');
  const exceptionMap = new Map(contract.exceptions.map(exception => [exception.id, exception]));
  if (exceptionMap.size !== contract.exceptions.length) add('duplicate-exception', 'Exception IDs must be unique');
  contract.exceptions.forEach(exception => exception.beatIds.forEach(beatId => {if (!boardIds.has(beatId)) add('exception-scope', `Exception ${exception.id} references an unknown beat`, beatId);}));
  const exceptionFor = (exceptionId: string | undefined, kind: VisualContract['exceptions'][number]['kind'], beatIds: string[]) => {
    const exception = exceptionId ? exceptionMap.get(exceptionId) : undefined;
    return Boolean(exception && exception.kind === kind && beatIds.every(beatId => exception.beatIds.includes(beatId)));
  };
  const allIds = [...boardIds];
  const pool = storyboard.styleMix?.pool;
  if (contract.stylePolicy.mode !== 'user-legacy') {
    try {assertSingleUseStyles(storyboard);} catch (error) {add('single-use-style', (error as Error).message);}
    const styleIds = contract.beats.map(beat => beat.styleId);
    if (new Set(styleIds).size !== styleIds.length) add('single-use-contract-style', 'Each contract scene must use one globally unique style, matching the actual plan');
  }
  if (contract.stylePolicy.mode === 'default-71') {
    if (!pool || pool.length !== VISUAL_STYLE_IDS.length || !VISUAL_STYLE_IDS.every(style => pool.includes(style))) add('default-style-pool', 'New mixed-style work must retain the complete 71-style pool; do not select a convenient subset silently');
    if (storyboard.presentation !== 'whole-screen-stage') add('default-stage', 'Default mixed-style work requires whole-screen-stage presentation');
  } else if (contract.stylePolicy.mode === 'user-custom') {
    if (!pool) add('custom-style-pool', 'Custom mode still requires a saved reproducible style pool');
    if (!exceptionFor(contract.stylePolicy.exceptionId, 'custom-style-pool', allIds)) add('unapproved-style-policy', 'Custom pool requires a scoped user-request quotation and evidence reference');
  } else {
    if (storyboard.styleMix || storyboard.beats.some(beat => beat.visualStyle)) add('legacy-style-conflict', 'Legacy mode must match a legacy storyboard, not relabel mixed-style scenes');
    if (!exceptionFor(contract.stylePolicy.exceptionId, 'legacy-style', allIds)) add('unapproved-style-policy', 'Legacy style requires a scoped user-request quotation and evidence reference');
  }

  const assetMap = new Map(contract.assets.map(asset => [asset.id, asset]));
  metrics.assets = assetMap.size;
  metrics.staticCards = contract.assets.filter(asset => asset.kind === 'authored-static-card').length;
  if (assetMap.size !== contract.assets.length) add('duplicate-asset', 'Asset IDs must be unique');
  if (!contract.assets.some(asset => asset.kind === 'source-media' && pathKey(asset.path) === pathKey(storyboard.source.video))) add('source-inventory', 'The actual source video/overlay source must be inventoried as source-media');
  const staticExceptionAssets = new Map<string, string>();
  for (const asset of contract.assets) {
    for (const window of asset.usage) if (window.end <= window.start || window.end > storyboard.duration + 0.001) add('asset-interval', `Asset ${asset.id} has an invalid or out-of-source usage interval`);
    if (asset.kind === 'authored-static-card') {
      const usedBeats = storyboard.beats.filter(beat => asset.usage.some(window => window.start < beat.end && window.end > beat.start)).map(beat => beat.id);
      if (!exceptionFor(asset.exceptionId, 'static-card', usedBeats)) add('unapproved-static-card', `Authored static card ${asset.id} needs its own explicit user-approved exception, including cards baked into precomposed video`);
      if (asset.exceptionId) {
        const priorAsset = staticExceptionAssets.get(asset.exceptionId);
        if (priorAsset) add('static-card-exception-reuse', `Static-card exception ${asset.exceptionId} already belongs to ${priorAsset}; each authored card needs its own scoped record`);
        staticExceptionAssets.set(asset.exceptionId, asset.id);
      }
    } else if (asset.exceptionId) add('unexpected-asset-exception', `Only authored-static-card assets use a static-card exception (${asset.id})`);
  }
  for (const assetId of contract.sourceAudit.embeddedGraphicsAssetIds) {
    const asset = assetMap.get(assetId);
    if (!asset || (asset.kind !== 'authored-graphic' && asset.kind !== 'authored-static-card')) add('embedded-inventory', `Embedded graphics must identify an authored asset, not just a flattened source video (${assetId})`);
  }
  if (contract.sourceAudit.videoKind === 'raw' && contract.sourceAudit.embeddedGraphicsAssetIds.length) add('source-audit-conflict', 'Raw source declaration conflicts with embedded authored graphics');
  // Precomposed can be a clean recut. The recorded source inspection, not a fake
  // fixed card count, must justify an empty embedded inventory during human review.

  const entries = new Map(contract.beats.map(beat => [beat.beatId, beat]));
  if (entries.size !== contract.beats.length) add('duplicate-beat', 'Contract beat IDs must be unique');
  for (const beatId of entries.keys()) if (!boardIds.has(beatId)) add('unknown-beat', 'Contract references an unknown beat', beatId);
  const signatures: string[] = [];
  const mechanisms = new Set<string>();
  for (const beat of storyboard.beats) {
    const entry = entries.get(beat.id);
    if (!entry) {add('missing-beat', 'Every storyboard beat needs a concrete visual contract', beat.id); continue;}
    if (entry.styleId !== (beat.visualStyle?.id ?? 'legacy')) add('style-binding', 'Declared style must match the saved storyboard assignment', beat.id);
    const frames = Math.max(1, Math.round((beat.end - beat.start) * storyboard.fps));
    const validWindow = (window: {startFrame: number; endFrame: number}) => window.endFrame > window.startFrame && window.endFrame <= frames;
    const reading = entry.reading;
    if (!validWindow(reading) || reading.endFrame - reading.startFrame < Math.min(Math.ceil(0.8 * storyboard.fps), Math.ceil(frames * 0.4))) add('reading-window', 'Text needs a real stable reading interval: at least min(0.8 seconds, 40% of this beat), inside the beat', beat.id);
    if (!validWindow(entry.visibleFeature)) add('feature-window', 'Visible feature interval must be inside the beat', beat.id);
    const region = entry.visibleFeature.region;
    if (region.x >= 1 || region.y >= 1 || region.x + region.width <= 0 || region.y + region.height <= 0) add('offscreen-feature', 'The promised distinguishing feature is completely outside the visible canvas', beat.id);
    if (beat.stage?.opacity !== undefined && beat.stage.opacity < 0.25) add('hidden-style', 'Stage opacity hides the promised visual feature', beat.id);
    if (beat.visualStyle && beat.visualStyle.intensity < 0.35) {
      metrics.lowIntensityBeats++;
      if (!sourceReading(beat) || !entry.lowIntensityReason) add('low-style-intensity', 'Intensity below 0.35 is reserved for source evidence/data reading with a concrete reason; a whole video at 0.2 is not a mixed-style implementation', beat.id);
    }
    if (entry.lowIntensityReason && (!beat.visualStyle || beat.visualStyle.intensity >= 0.35)) add('unneeded-low-intensity-reason', 'Low-intensity rationale must describe an actual low-intensity scene', beat.id);
    const motion = entry.motion;
    const quietApproved = exceptionFor(motion.exceptionId, 'quiet-motion', [beat.id]);
    if (simpleMotion(motion.mechanism) && !(sourceReading(beat) && motion.phase === 'quiet-reading') && !quietApproved) add('decorative-motion-missing', 'None/fade is not a mixed-style motion mechanism; quiet source reading or a scoped user-approved exception is required', beat.id);
    if (!simpleMotion(motion.mechanism)) {
      mechanisms.add(motion.mechanism);
      if (!motion.activeWindows.length) add('motion-window', 'A nontrivial movement needs one or more concrete active frame intervals', beat.id);
    }
    motion.activeWindows.forEach((window, index) => {
      if (!validWindow(window) || (index > 0 && window.startFrame < motion.activeWindows[index - 1].endFrame)) add('motion-window', 'Active motion intervals must be valid, ordered and non-overlapping', beat.id);
    });
    if (motion.phase === 'sustained' && (!motion.activeWindows.length || Math.max(...motion.activeWindows.map(window => window.endFrame)) < frames * 0.6)) add('premature-motion-freeze', 'Sustained decorative motion must reach the latter part of this beat; freezing every effect after 0.9 seconds is not stabilization', beat.id);
    if (motion.phase === 'quiet-reading' && !sourceReading(beat) && !quietApproved) add('unapproved-quiet-reading', 'Quiet-reading is for actual evidence/data, not a global static-card bypass', beat.id);
    if (new Set(entry.assetIds).size !== entry.assetIds.length) add('duplicate-beat-asset', 'Beat asset IDs must be unique', beat.id);
    for (const assetId of entry.assetIds) {
      const asset = assetMap.get(assetId);
      if (!asset) add('unknown-asset', `Beat references an unknown asset ${assetId}`, beat.id);
      else if (!asset.usage.some(window => window.start < beat.end && window.end > beat.start)) add('asset-usage-mismatch', `Asset ${assetId} is not declared during this beat`, beat.id);
    }
    if (beat.evidence) {
      const evidence = contract.assets.find(asset => pathKey(asset.path) === pathKey(beat.evidence!.src) && asset.kind === 'source-evidence');
      if (!evidence || !entry.assetIds.includes(evidence.id)) add('evidence-inventory', 'Real evidence must be inventoried and referenced as source-evidence, not an authored illustration', beat.id);
    }
    // A stage-wide transform also moves its text. Keep text stabilization separate
    // from decorative child animation, rather than declaring a global freeze.
    const keys = ['x', 'y', 'width', 'height', 'scale', 'rotation'] as const;
    const keyframes = beat.stage?.keyframes ?? [];
    for (let index = 0; index < keyframes.length; index++) {
      const next = keyframes[index];
      const previousFrame = index ? keyframes[index - 1].frame : 0;
      if (next.frame <= reading.startFrame || previousFrame >= reading.endFrame) continue;
      for (const key of keys) {
        if (next[key] === undefined) continue;
        const prior = [...keyframes.slice(0, index)].reverse().find(frame => frame[key] !== undefined)?.[key] ?? beat.stage?.[key] ?? (key === 'scale' ? 1 : 0);
        if (next[key] !== prior) {add('reading-transform', 'Stage transform moves text during its declared stable reading window; animate decoration independently', beat.id); break;}
      }
    }
    signatures.push(`${entry.visibleFeature.family}|${entry.visibleFeature.description.toLowerCase()}|${motion.mechanism}|${entry.visibleFeature.layoutRole.toLowerCase()}`);
  }
  metrics.featureSignatures = new Set(signatures).size;
  metrics.motionMechanisms = mechanisms.size;
  if (storyboard.beats.length >= 3 && signatures.length === storyboard.beats.length && metrics.featureSignatures === 1 && contract.stylePolicy.mode === 'default-71') add('repeated-visual-treatment', 'Different style IDs with the same declared geometry, motion and layout are not distinct visual treatments');
  return {ok: issues.length === 0, issues, metrics, contract};
};

export const assertVisualContract = (storyboard: Storyboard, rawContract: unknown): VisualContract => {
  const analysis = analyzeVisualContract(storyboard, rawContract);
  if (!analysis.ok) throw new Error(`Visual contract rejected: ${analysis.issues.map(issue => `${issue.code}${issue.beatId ? `(${issue.beatId})` : ''}: ${issue.message}`).join('; ')}`);
  return analysis.contract!;
};

/** Intentionally incomplete. Never generates observations, approvals or a ready
 * self-certificate. Gate A may save it for editing; Gate B rejects it as-is. */
export const createVisualContractTemplate = (storyboard: Storyboard): unknown => ({
  version: '1.0', storyboardId: storyboard.id, status: 'draft',
  stylePolicy: {mode: !storyboard.styleMix ? 'user-legacy' : storyboard.styleMix.pool.length === VISUAL_STYLE_IDS.length ? 'default-71' : 'user-custom'},
  exceptions: [], sourceAudit: {videoKind: 'raw', inspectedBy: '', inspectionEvidence: '', embeddedGraphicsAssetIds: []},
  assets: [{id: 'source-video', path: storyboard.source.video, kind: 'source-media', sourceRef: '', usage: [{start: 0, end: storyboard.duration}]}],
  beats: storyboard.beats.map(beat => ({
    beatId: beat.id, styleId: beat.visualStyle?.id ?? 'legacy',
    visibleFeature: {family: 'geometry', description: '', layoutRole: '', region: {x: 0, y: 0, width: 1, height: 1}, startFrame: 0, endFrame: Math.max(1, Math.round((beat.end - beat.start) * storyboard.fps))},
    motion: {mechanism: 'none', phase: 'sustained', activeWindows: [], decoratedProperty: '', description: '', textIndependent: true},
    reading: {startFrame: 0, endFrame: Math.max(1, Math.round((beat.end - beat.start) * storyboard.fps)), stableText: true, description: ''}, assetIds: [],
  })),
});
