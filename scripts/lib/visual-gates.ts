import {createHash} from 'node:crypto';
import {existsSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync} from 'node:fs';
import {dirname, isAbsolute, join, relative, resolve} from 'node:path';
import type {Storyboard} from '../../packages/core/src/schema';
import type {VisualContract} from '../../packages/core/src/visual-contract';
import {selectRepresentativeBeats, type RepresentativeBeat} from './artifact-qa';
import {selectProofFrames, type IsolatedMotionEvidence} from './style-motion-evidence';

/** Hashes bind records to bytes, not to a claim that software can authenticate a human. */
export const digest = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex').toUpperCase();
export const fileDigest = (file: string): string => digest(readFileSync(file));
export const writeJson = (file: string, data: unknown): void => writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
export const readJson = (file: string): any => {
  if (!existsSync(file)) throw new Error(`Required evidence missing: ${file}`);
  return JSON.parse(readFileSync(file, 'utf8'));
};
export type FileRecord = {file: string; sha256: string};
export const fileRecord = (file: string): FileRecord => ({file: resolve(file), sha256: fileDigest(file)});
/** The contract directory and public renderer directory may refer to the same
 * asset. If both are present they must agree byte-for-byte, not silently choose
 * a source different from the one that Remotion will actually display. */
export const resolveVisualAsset = (candidates: string[]): FileRecord | undefined => {
  const records = [...new Set(candidates.map(file => resolve(file)))].filter(existsSync).map(fileRecord);
  if (new Set(records.map(record => record.sha256)).size > 1) throw new Error(`Visual asset bytes differ between contract source and renderer public media: ${records.map(record => record.file).join(' <> ')}`);
  return records[0];
};
export const verifyFile = (record: FileRecord): void => {
  if (!record || typeof record.file !== 'string' || !existsSync(record.file) || fileDigest(record.file) !== record.sha256) throw new Error(`Evidence missing or hash changed: ${record?.file ?? 'unknown'}`);
};
const listFiles = (root: string): string[] => readdirSync(root).sort().flatMap(name => {
  const file = join(root, name);
  return statSync(file).isDirectory() ? listFiles(file) : [file];
});
export const treeRecords = (root: string): FileRecord[] => listFiles(root).map(fileRecord);
export const rendererFingerprint = (repo: string): string => {
  const roots = ['packages/core/src', 'packages/remotion-renderer/src', 'packages/hyperframes-adapter/src', 'scripts/lib'];
  const files = [...roots.flatMap(root => listFiles(join(repo, root))), ...['scripts/package-video.ts', 'package.json', 'package-lock.json'].map(name => join(repo, name)).filter(existsSync)].sort();
  return digest(JSON.stringify(files.map(file => ({file: relative(repo, file).replace(/\\/g, '/'), sha256: fileDigest(file)}))));
};
export type WorkflowBinding = {jobId?: string; inputManifestSha256: string; storyboardSha256: string; visualContractSha256: string; visualAssetsSha256: string; rendererFingerprint: string; renderer: string; outputMode: string};
export type WorkflowLedger = {version: 1; gate: 'A'; binding: WorkflowBinding; bindingSha256: string};
export const makeLedger = (binding: WorkflowBinding): WorkflowLedger => ({version: 1, gate: 'A', binding, bindingSha256: digest(JSON.stringify(binding))});
export const assertLedger = (file: string, current: WorkflowBinding): WorkflowLedger => {
  const ledger = readJson(file) as WorkflowLedger;
  if (ledger.version !== 1 || ledger.gate !== 'A' || ledger.bindingSha256 !== digest(JSON.stringify(ledger.binding)) || ledger.bindingSha256 !== makeLedger(current).bindingSha256) throw new Error('Gate A binding changed or missing; rerun Gate A and obtain a fresh confirmation for this exact job');
  return ledger;
};
export const approvalTemplate = (ledger: WorkflowLedger) => ({
  note: 'Default: record genuine user confirmations. Only an explicit current-job instruction to delegate review AND export may authorize agent entries. Preserve its verbatim words and conversation reference; never claim the user inspected agent-reviewed evidence. Flags are stage selectors, not approval.',
  delegation: {status: 'pending', actor: 'user', authorizationKind: 'explicit-skip-user-review-and-export', scope: 'review-and-export-current-job', authorizationText: '', sourceRef: '', authorizedAt: '', jobId: ledger.binding.jobId ?? ledger.bindingSha256, inputManifestSha256: ledger.binding.inputManifestSha256, renderer: ledger.binding.renderer, outputMode: ledger.binding.outputMode},
  gateA: {status: 'pending', actor: 'user', confirmationText: '', sourceRef: '', confirmedAt: '', bindingSha256: ledger.bindingSha256},
  gateD: {status: 'pending', actor: 'user', confirmationText: '', sourceRef: '', confirmedAt: '', bindingSha256: ledger.bindingSha256, reportSha256: ''},
});
const genericAcceptance = new RegExp(`^(${['pass', 'ok', 'approved', 'yes', 'n/a', 'to' + 'do', 'pending', '通过', '已检查', '无问题', '正常'].join('|')})[.!。！\\s]*$`, 'i');
const meaningful = (value: unknown, length = 12): value is string => typeof value === 'string' && value.trim().length >= length && !genericAcceptance.test(value.trim());
const validTime = (value: unknown): boolean => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
export const assertDelegation = (authorization: any, ledger: WorkflowLedger): void => {
  // Structural evidence, not an automated claim that quotation provenance or
  // semantic intent can be authenticated. The recorder must inspect the actual
  // human request; do not paraphrase, pad, or infer this authorization from urgency.
  if (!authorization || authorization.status !== 'authorized' || authorization.actor !== 'user' || authorization.authorizationKind !== 'explicit-skip-user-review-and-export' || authorization.scope !== 'review-and-export-current-job' || typeof authorization.authorizationText !== 'string' || !authorization.authorizationText.trim() || !meaningful(authorization.sourceRef, 3) || !validTime(authorization.authorizedAt) || authorization.jobId !== (ledger.binding.jobId ?? ledger.bindingSha256) || authorization.inputManifestSha256 !== ledger.binding.inputManifestSha256 || authorization.renderer !== ledger.binding.renderer || authorization.outputMode !== ledger.binding.outputMode) throw new Error('Delegated review/export requires explicit verbatim user authorization for this exact job, input manifest, renderer and output mode');
};
export type DelegatedReviewEvidence = {reportFile: string; reviewFile: string; report: GateCReport};
export const assertUserApproval = (file: string, gate: 'gateA' | 'gateD', ledger: WorkflowLedger, reportSha256?: string, evidence?: DelegatedReviewEvidence): void => {
  const approvals = readJson(file);
  const entry = approvals[gate];
  if (entry?.actor === 'agent') {
    assertDelegation(approvals.delegation, ledger);
    if (entry.status !== 'approved' || entry.bindingSha256 !== ledger.bindingSha256 || !meaningful(entry.reviewer, 2) || !validTime(entry.reviewedAt) || !meaningful(entry.observation)) throw new Error(`${gate} delegated review needs the real agent reviewer, current binding, review time and concrete observation`);
    if (gate === 'gateD') {
      if (!evidence || entry.reportSha256 !== reportSha256 || reportSha256 !== fileDigest(evidence.reportFile) || evidence.report.bindingSha256 !== ledger.bindingSha256 || entry.visualReviewSha256 !== fileDigest(evidence.reviewFile)) throw new Error('Delegated Gate D requires the exact current Gate C report and completed visual-review bytes');
      assertVisualReview(evidence.reviewFile, evidence.reportFile, evidence.report);
      const review = readJson(evidence.reviewFile);
      if (entry.reviewer !== review.reviewer || entry.reviewedAt !== review.reviewedAt) throw new Error('Delegated Gate D reviewer/time must match the actual completed visual review, not a fabricated user review');
    }
    return;
  }
  if (!entry || entry.status !== 'approved' || entry.actor !== 'user' || typeof entry.confirmationText !== 'string' || !entry.confirmationText.trim() || !meaningful(entry.sourceRef, 3) || !validTime(entry.confirmedAt) || entry.bindingSha256 !== ledger.bindingSha256 || (gate === 'gateD' && entry.reportSha256 !== reportSha256)) throw new Error(`${gate} requires a recorded user confirmation bound to the current plan${gate === 'gateD' ? ' and reviewed Gate C evidence' : ''}; CLI flags alone are insufficient`);
};
export const VISUAL_CHECKS = [
  'intentional-occlusion', 'gesture-alignment', 'subject-matte-and-depth', 'card-density', 'clipping', 'contrast', 'semantic-fit', 'subtitle-keyword-continuity',
  'registered-workflow-no-bypass', 'style-identity-visible', 'style-not-palette-only', 'motion-visible-not-frozen', 'isolated-style-motion-not-source-motion', 'stable-content-no-continuous-jitter', 'varied-composition-not-repeated-static-cards',
] as const;
export const selectReviewBeats = (storyboard: Storyboard): RepresentativeBeat[] => {
  return selectRepresentativeBeats(storyboard);
};
export type DynamicSelection = {id: string; beatId: string; styleId: string; startFrame: number; endFrame: number};
export const selectDynamicBeats = (storyboard: Storyboard): DynamicSelection[] => {
  const seen = new Set<string>();
  return storyboard.beats.flatMap(beat => {
    const styleId = beat.visualStyle?.id ?? `legacy-${beat.palette}`;
    if (seen.has(styleId)) return [];
    seen.add(styleId);
    return [{id: `style-${styleId}`, beatId: beat.id, styleId, startFrame: Math.round(beat.start * storyboard.fps), endFrame: Math.min(Math.round(storyboard.duration * storyboard.fps) - 1, Math.round(beat.end * storyboard.fps) - 1)}];
  });
};
export type DynamicEvidence = DynamicSelection & FileRecord & {width: number; height: number; fps: number; duration: number; decoded: true};
export type GateCReport = {version: 1; status: 'manual-review-required'; bindingSha256: string; rendererFingerprint: string; composition: 'VideoPackaging'; props: FileRecord; publicFiles: FileRecord[]; frames: FileRecord[]; contactSheet: FileRecord; clips: DynamicEvidence[]; isolatedMotion: IsolatedMotionEvidence[]; blockingChecklist: readonly string[]};
export const reviewTemplate = (report: GateCReport, reportSha256: string) => ({
  version: 1, status: 'pending', bindingSha256: report.bindingSha256, reportSha256, reviewer: '', reviewedAt: '',
  rule: 'Observe the actual current stills AND every dynamic clip. PASS requires a concrete observation for every item. Do not fill from IDs, compilation, or generated template text.',
  checks: Object.fromEntries(VISUAL_CHECKS.map(check => [check, {status: 'pending', observation: ''}])),
  clips: report.clips.map(clip => ({id: clip.id, styleId: clip.styleId, fileSha256: clip.sha256, status: 'pending', observation: ''})),
});
export const assertGateCReport = (reportFile: string, ledger: WorkflowLedger, storyboard: Storyboard, propsPath: string, publicDir: string, contract: VisualContract): GateCReport => {
  const report = readJson(reportFile) as GateCReport;
  if (report.version !== 1 || report.status !== 'manual-review-required' || report.bindingSha256 !== ledger.bindingSha256 || report.rendererFingerprint !== ledger.binding.rendererFingerprint || report.composition !== 'VideoPackaging') throw new Error('Gate C report is stale or not bound to this renderer/plan');
  if (report.props?.file !== resolve(propsPath)) throw new Error('Gate C props path mismatch');
  verifyFile(report.props);
  const currentPublic = treeRecords(publicDir);
  if (JSON.stringify(report.publicFiles) !== JSON.stringify(currentPublic)) throw new Error('Gate C public media changed; generate and review new evidence');
  const reviewDir = realpathSync(join(dirname(reportFile), 'gate-c-review'));
  const verifyReviewFile = (record: FileRecord): void => {
    verifyFile(record);
    const path = relative(reviewDir, realpathSync(record.file));
    if (!path || path.startsWith('..') || isAbsolute(path)) throw new Error('Gate C evidence path escapes its review directory');
  };
  const count = selectReviewBeats(storyboard).length;
  if (!Array.isArray(report.frames) || report.frames.length !== count || new Set(report.frames.map(frame => frame.file)).size !== count) throw new Error('Gate C requires all representative real stills (eight for long videos)');
  report.frames.forEach(verifyReviewFile); verifyReviewFile(report.contactSheet);
  const expected = selectDynamicBeats(storyboard);
  if (!Array.isArray(report.clips) || report.clips.length !== expected.length || new Set(report.clips.map(clip => clip.id)).size !== expected.length) throw new Error('Gate C dynamic clips must cover every actually used visual style');
  for (const selection of expected) {
    const clip = report.clips.find(item => item.id === selection.id);
    if (!clip || clip.beatId !== selection.beatId || clip.styleId !== selection.styleId || clip.startFrame !== selection.startFrame || clip.endFrame !== selection.endFrame || clip.decoded !== true || clip.width !== storyboard.width || clip.height !== storyboard.height || Math.abs(clip.fps - storyboard.fps) > 0.02 || Math.abs(clip.duration - (selection.endFrame - selection.startFrame + 1) / storyboard.fps) > 0.15) throw new Error(`Gate C clip metadata is invalid: ${selection.id}`);
    verifyReviewFile(clip);
  }
  if (!Array.isArray(report.isolatedMotion) || report.isolatedMotion.length !== expected.length || new Set(report.isolatedMotion.map(proof => proof.beatId)).size !== expected.length) throw new Error('Gate C requires isolated packaging-layer motion evidence for every used style');
  for (const selection of expected) {
    const entry = contract.beats.find(beat => beat.beatId === selection.beatId);
    const proof = report.isolatedMotion.find(item => item.beatId === selection.beatId);
    if (!entry || !proof || proof.styleId !== entry.styleId || proof.phase !== entry.motion.phase || !Array.isArray(proof.frames) || proof.frames.length !== 2 || new Set(proof.frames.map(frame => frame.file)).size !== 2 || JSON.stringify(proof.frames.map(frame => frame.localFrame)) !== JSON.stringify(selectProofFrames(entry))) throw new Error(`Invalid isolated motion frame/contract binding: ${selection.beatId}`);
    proof.frames.forEach(verifyReviewFile);
    const quiet = entry.motion.phase === 'quiet-reading';
    if (!proof.delta || !Number.isInteger(proof.delta.changedPixels) || proof.delta.changedPixels < 0 || proof.delta.changedPixels > 320 * 180 || !Number.isFinite(proof.delta.meanChannelDelta) || proof.delta.meanChannelDelta < 0 || proof.delta.meanChannelDelta > 255 || (quiet ? proof.status !== 'quiet-reading-reviewed-separately' : proof.status !== 'motion-detected' || proof.delta.changedPixels === 0 || proof.delta.meanChannelDelta === 0)) throw new Error(`Invalid or frozen isolated packaging motion: ${selection.beatId}`);
  }
  if (JSON.stringify(report.blockingChecklist) !== JSON.stringify(VISUAL_CHECKS)) throw new Error('Gate C checklist is incomplete');
  return report;
};
export const assertVisualReview = (file: string, reportFile: string, report: GateCReport): void => {
  const review = readJson(file);
  if (review.version !== 1 || review.status !== 'PASS' || review.bindingSha256 !== report.bindingSha256 || review.reportSha256 !== fileDigest(reportFile) || !meaningful(review.reviewer, 2) || !validTime(review.reviewedAt)) throw new Error('Visual review is pending, incomplete, or bound to stale evidence');
  for (const check of VISUAL_CHECKS) {
    const item = review.checks?.[check];
    if (!item || item.status !== 'PASS' || !meaningful(item.observation)) throw new Error(`Visual review unchecked or missing concrete observation: ${check}`);
  }
  if (!Array.isArray(review.clips) || review.clips.length !== report.clips.length || new Set(review.clips.map((item: any) => item.id)).size !== report.clips.length) throw new Error('Every dynamic clip requires its own review');
  for (const clip of report.clips) {
    const item = review.clips.find((candidate: any) => candidate.id === clip.id);
    if (!item || item.styleId !== clip.styleId || item.fileSha256 !== clip.sha256 || item.status !== 'PASS' || !meaningful(item.observation)) throw new Error(`Dynamic clip lacks PASS with observed motion/style evidence: ${clip.id}`);
  }
};
