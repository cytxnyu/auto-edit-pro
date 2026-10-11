import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import type {Storyboard} from '../packages/core/src/schema';
import type {VisualContract} from '../packages/core/src/visual-contract';
import {selectProofFrames} from '../scripts/lib/style-motion-evidence';
import {approvalTemplate, assertGateCReport, assertLedger, assertUserApproval, assertVisualReview, fileDigest, fileRecord, makeLedger, rendererFingerprint, resolveVisualAsset, reviewTemplate, selectDynamicBeats, selectReviewBeats, treeRecords, VISUAL_CHECKS, writeJson, type GateCReport, type WorkflowBinding} from '../scripts/lib/visual-gates';

// These files are deliberately synthetic unit fixtures; CLI integration creates real media.
const folders: string[] = [];
const binding: WorkflowBinding = {inputManifestSha256: 'input', storyboardSha256: 'board', visualContractSha256: 'contract', visualAssetsSha256: 'assets', rendererFingerprint: 'source', renderer: 'remotion', outputMode: 'composite'};
const board = {duration: 4, fps: 30, width: 320, height: 180, beats: [
  {id: 'one', start: 0, end: 2, structure: 'thesis-and-proof', placement: 'full', palette: 'balatro', visualStyle: {id: 'balatro'}},
  {id: 'two', start: 2, end: 4, structure: 'command-palette', placement: 'full', palette: 'cubes', visualStyle: {id: 'cubes'}},
]} as unknown as Storyboard;
const contract = {beats: board.beats.map(beat => ({beatId: beat.id, styleId: beat.visualStyle!.id, motion: {phase: 'sustained', activeWindows: [{startFrame: 0, endFrame: 60}]}, reading: {startFrame: 0, endFrame: 60}}))} as unknown as VisualContract;
const setup = () => {
  const dir = mkdtempSync(join(tmpdir(), 'visual-gates-test-')); folders.push(dir);
  const publicDir = join(dir, 'public'); const reviewDir = join(dir, 'gate-c-review');
  mkdirSync(publicDir); mkdirSync(reviewDir);
  const fixture = (file: string, content: string) => {writeFileSync(file, content); return fileRecord(file);};
  fixture(join(publicDir, 'input.mp4'), 'source media');
  const props = fixture(join(dir, 'props.json'), 'composition props');
  const ledger = makeLedger(binding); const ledgerPath = join(dir, 'WORKFLOW_LEDGER.json'); writeJson(ledgerPath, ledger);
  const report: GateCReport = {version: 1, status: 'manual-review-required', bindingSha256: ledger.bindingSha256, rendererFingerprint: binding.rendererFingerprint, composition: 'VideoPackaging', props, publicFiles: treeRecords(publicDir),
    frames: [fixture(join(reviewDir, 'one.png'), 'still one'), fixture(join(reviewDir, 'two.png'), 'still two')], contactSheet: fixture(join(reviewDir, 'contact.jpg'), 'contact sheet'),
    clips: selectDynamicBeats(board).map(selection => ({...selection, ...fixture(join(reviewDir, `${selection.id}.mp4`), selection.id), width: 320, height: 180, fps: 30, duration: 2, decoded: true})), isolatedMotion: contract.beats.map(entry => ({beatId: entry.beatId, styleId: entry.styleId, phase: entry.motion.phase, status: 'motion-detected', frames: selectProofFrames(entry).map(localFrame => ({localFrame, ...fixture(join(reviewDir, `${entry.beatId}-${localFrame}.png`), 'isolated proof ' + localFrame)})), delta: {changedPixels: 10, meanChannelDelta: 1}})), blockingChecklist: VISUAL_CHECKS};
  const reportPath = join(dir, 'GATE_C_REPORT.json'); writeJson(reportPath, report);
  const review: any = reviewTemplate(report, fileDigest(reportPath));
  const reviewPath = join(dir, 'VISUAL_REVIEW.json'); writeJson(reviewPath, review);
  const validReview = () => {
    review.status = 'PASS'; review.reviewer = 'fixture reviewer'; review.reviewedAt = '2026-10-11T10:00:00+08:00';
    for (const [name, item] of Object.entries(review.checks)) Object.assign(item as object, {status: 'PASS', observation: `Fixture observation for ${name}: geometry is legible and source text remains stable.`});
    for (const clip of review.clips) Object.assign(clip, {status: 'PASS', observation: `Observed ${clip.styleId} geometry continuing to move while readable foreground text stays still.`});
    writeJson(reviewPath, review);
  };
  return {dir, publicDir, reviewDir, ledger, ledgerPath, report, reportPath, review, reviewPath, validReview, propsPath: props.file};
};
afterEach(() => {for (const dir of folders.splice(0)) rmSync(dir, {recursive: true, force: true});});

describe('bound visual gate enforcement', () => {
  const delegatedFixture = () => {
    const f = setup(); const file = join(f.dir, 'USER_APPROVALS.json'); const approvals: any = approvalTemplate(f.ledger);
    Object.assign(approvals.delegation, {status: 'authorized', authorizationText: '你验收并导出', sourceRef: 'synthetic-explicit-user-turn-5', authorizedAt: '2026-10-11T00:00:00Z'});
    Object.assign(approvals.gateA, {status: 'approved', actor: 'agent', reviewer: 'fixture reviewer', reviewedAt: '2026-10-11T10:00:00+08:00', observation: 'Checked this fixture plan against its source and exact current input binding.'});
    f.validReview();
    Object.assign(approvals.gateD, {status: 'approved', actor: 'agent', reviewer: f.review.reviewer, reviewedAt: f.review.reviewedAt, observation: 'Inspected all fixture clips and current checklist before the delegated export.', reportSha256: fileDigest(f.reportPath), visualReviewSha256: fileDigest(f.reviewPath)});
    writeJson(file, approvals);
    const evidence = {reportFile: f.reportPath, reviewFile: f.reviewPath, report: f.report};
    return {...f, file, approvals, evidence};
  };
  it('supports explicit job-scoped delegated A and D without inventing user review', () => {
    const f = delegatedFixture();
    expect(f.approvals.delegation.authorizationText).toBe('你验收并导出'); // real short quotes stay verbatim
    expect(() => assertUserApproval(f.file, 'gateA', f.ledger)).not.toThrow();
    expect(() => assertUserApproval(f.file, 'gateD', f.ledger, fileDigest(f.reportPath), f.evidence)).not.toThrow();
    expect(f.approvals.gateD.actor).toBe('agent');
  });
  it.each(['absent', 'pending', 'blank-quote', 'blank-source', 'wrong-kind', 'wrong-scope', 'agent-authorization', 'changed-input', 'changed-job', 'changed-renderer', 'changed-mode'])('blocks delegated approval with %s authorization', kind => {
    const f = delegatedFixture(); const a = f.approvals.delegation;
    if (kind === 'absent') delete f.approvals.delegation;
    if (kind === 'pending') a.status = 'pending';
    if (kind === 'blank-quote') a.authorizationText = '   ';
    if (kind === 'blank-source') a.sourceRef = '';
    if (kind === 'wrong-kind') a.authorizationKind = 'general-permission';
    if (kind === 'wrong-scope') a.scope = 'all-future-jobs';
    if (kind === 'agent-authorization') a.actor = 'agent';
    if (kind === 'changed-input') a.inputManifestSha256 = 'another-input';
    if (kind === 'changed-job') a.jobId = 'another-run';
    if (kind === 'changed-renderer') a.renderer = 'hyperframes';
    if (kind === 'changed-mode') a.outputMode = 'overlay';
    writeJson(f.file, f.approvals);
    expect(() => assertUserApproval(f.file, 'gateA', f.ledger)).toThrow(/explicit verbatim user authorization/);
    expect(() => assertUserApproval(f.file, 'gateD', f.ledger, fileDigest(f.reportPath), f.evidence)).toThrow(/explicit verbatim user authorization/);
  });
  it('keeps delegated decisions revision-bound and requires actual reviewer metadata', () => {
    for (const field of ['bindingSha256', 'reviewer', 'reviewedAt', 'observation']) {
      const f = delegatedFixture(); f.approvals.gateA[field] = ''; writeJson(f.file, f.approvals);
      expect(() => assertUserApproval(f.file, 'gateA', f.ledger)).toThrow(/delegated review/);
    }
    const f = delegatedFixture();
    expect(() => assertUserApproval(f.file, 'gateD', f.ledger, fileDigest(f.reportPath))).toThrow(/exact current Gate C/);
    f.approvals.gateD.reviewer = 'invented different reviewer'; writeJson(f.file, f.approvals);
    expect(() => assertUserApproval(f.file, 'gateD', f.ledger, fileDigest(f.reportPath), f.evidence)).toThrow(/reviewer\/time/);
  });
  it.each(VISUAL_CHECKS)('delegation never skips Gate C check %s', check => {
    const f = delegatedFixture(); f.review.checks[check].status = 'pending'; writeJson(f.reviewPath, f.review);
    f.approvals.gateD.visualReviewSha256 = fileDigest(f.reviewPath); writeJson(f.file, f.approvals);
    expect(() => assertUserApproval(f.file, 'gateD', f.ledger, fileDigest(f.reportPath), f.evidence)).toThrow(check);
  });
  it('invalidates delegated D when review or report bytes change', () => {
    const f = delegatedFixture(); writeFileSync(f.reviewPath, JSON.stringify(f.review));
    expect(() => assertUserApproval(f.file, 'gateD', f.ledger, fileDigest(f.reportPath), f.evidence)).toThrow(/exact current/);
    f.approvals.gateD.visualReviewSha256 = fileDigest(f.reviewPath); writeJson(f.file, f.approvals);
    writeFileSync(f.reportPath, JSON.stringify(f.report));
    expect(() => assertUserApproval(f.file, 'gateD', f.ledger, fileDigest(f.reportPath), f.evidence)).toThrow(/exact current/);
  });
  it('rejects contract/public same-name asset conflicts and accepts identical bytes', () => {
    const f = setup(); const source = join(f.dir, 'evidence.png'); const rendered = join(f.publicDir, 'evidence.png');
    writeFileSync(source, 'approved source'); writeFileSync(rendered, 'different image');
    expect(() => resolveVisualAsset([source, rendered])).toThrow(/bytes differ/);
    writeFileSync(rendered, 'approved source');
    expect(resolveVisualAsset([source, rendered])).toEqual(fileRecord(source));
    expect(resolveVisualAsset([rendered, rendered])).toEqual(fileRecord(rendered));
    expect(resolveVisualAsset([join(f.dir, 'missing.png')])).toBeUndefined();
  });
  it('fingerprints the actual renderer, core, CLI, helper and dependency-lock bytes', () => {
    const f = setup(); const repo = join(f.dir, 'repo');
    for (const path of ['packages/core/src', 'packages/remotion-renderer/src', 'packages/hyperframes-adapter/src', 'scripts/lib']) mkdirSync(join(repo, path), {recursive: true});
    const names = ['packages/core/src/schema.ts', 'packages/remotion-renderer/src/style.tsx', 'scripts/package-video.ts', 'scripts/lib/visual-gates.ts', 'package-lock.json'];
    for (const name of names) writeFileSync(join(repo, name), 'original');
    const original = rendererFingerprint(repo); expect(rendererFingerprint(repo)).toBe(original);
    for (const name of names) {writeFileSync(join(repo, name), 'changed'); expect(rendererFingerprint(repo)).not.toBe(original); writeFileSync(join(repo, name), 'original');}
  });
  it('requires a prior A ledger and rejects every changed bound field', () => {
    const f = setup();
    expect(assertLedger(f.ledgerPath, binding)).toEqual(f.ledger);
    expect(() => assertLedger(join(f.dir, 'missing'), binding)).toThrow(/missing/);
    for (const field of Object.keys(binding) as Array<keyof WorkflowBinding>) expect(() => assertLedger(f.ledgerPath, {...binding, [field]: 'changed'})).toThrow(/binding changed/);
  });
  it('never generates an approval and does not accept status-only user confirmation', () => {
    const f = setup(); const file = join(f.dir, 'USER_APPROVALS.json'); const approvals: any = approvalTemplate(f.ledger); writeJson(file, approvals);
    expect(() => assertUserApproval(file, 'gateA', f.ledger)).toThrow(/recorded user confirmation/);
    approvals.gateA.status = 'approved'; writeJson(file, approvals);
    expect(() => assertUserApproval(file, 'gateA', f.ledger)).toThrow(/recorded user confirmation/);
    Object.assign(approvals.gateA, {confirmationText: 'Proceed with this exact fixture plan', sourceRef: 'synthetic-test-turn-1', confirmedAt: '2026-10-11T00:00:00Z'}); writeJson(file, approvals);
    expect(() => assertUserApproval(file, 'gateA', f.ledger)).not.toThrow();
    approvals.gateA.confirmationText = '通过'; writeJson(file, approvals);
    expect(() => assertUserApproval(file, 'gateA', f.ledger)).not.toThrow();
    expect(() => assertUserApproval(file, 'gateD', f.ledger, fileDigest(f.reportPath))).toThrow();
  });
  it('accepts exact current evidence but refuses missing, altered and unbound reports', () => {
    const f = setup();
    expect(assertGateCReport(f.reportPath, f.ledger, board, f.propsPath, f.publicDir, contract)).toEqual(f.report);
    expect(() => assertGateCReport(join(f.dir, 'missing'), f.ledger, board, f.propsPath, f.publicDir, contract)).toThrow(/missing/);
    f.report.bindingSha256 = 'stale'; writeJson(f.reportPath, f.report);
    expect(() => assertGateCReport(f.reportPath, f.ledger, board, f.propsPath, f.publicDir, contract)).toThrow(/stale/);
  });
  it.each(['props', 'source', 'clip', 'still'])('invalidates replaced %s bytes', kind => {
    const f = setup(); const file = kind === 'props' ? f.propsPath : kind === 'source' ? join(f.publicDir, 'input.mp4') : kind === 'clip' ? f.report.clips[0].file : f.report.frames[0].file;
    writeFileSync(file, 'substituted content');
    expect(() => assertGateCReport(f.reportPath, f.ledger, board, f.propsPath, f.publicDir, contract)).toThrow(/hash changed|media changed/);
  });
  it('refuses evidence paths outside the report directory', () => {
    const f = setup(); const outside = join(f.dir, 'outside.png'); writeFileSync(outside, 'outside'); f.report.frames[0] = fileRecord(outside); writeJson(f.reportPath, f.report);
    expect(() => assertGateCReport(f.reportPath, f.ledger, board, f.propsPath, f.publicDir, contract)).toThrow(/escapes/);
  });
  it('requires real decoded metadata and complete used-style clip coverage', () => {
    const f = setup(); (f.report.clips[0] as any).decoded = false; writeJson(f.reportPath, f.report);
    expect(() => assertGateCReport(f.reportPath, f.ledger, board, f.propsPath, f.publicDir, contract)).toThrow(/metadata/);
    f.report.clips = []; writeJson(f.reportPath, f.report);
    expect(() => assertGateCReport(f.reportPath, f.ledger, board, f.propsPath, f.publicDir, contract)).toThrow(/every actually used/);
  });
  it.each(['missing', 'frozen', 'changed-frame', 'wrong-phase', 'wrong-local-frame'])('blocks %s isolated packaging proof', kind => {
    const f = setup();
    if (kind === 'missing') f.report.isolatedMotion = [];
    else if (kind === 'frozen') f.report.isolatedMotion[0].delta = {changedPixels: 0, meanChannelDelta: 0};
    else if (kind === 'changed-frame') writeFileSync(f.report.isolatedMotion[0].frames[0].file, 'replaced proof');
    else if (kind === 'wrong-phase') f.report.isolatedMotion[0].phase = 'quiet-reading';
    else f.report.isolatedMotion[0].frames[0].localFrame = 0;
    writeJson(f.reportPath, f.report);
    expect(() => assertGateCReport(f.reportPath, f.ledger, board, f.propsPath, f.publicDir, contract)).toThrow(/isolated|hash changed/);
  });
  it('blocks generated pending and forged status-only PASS, but accepts complete observed review', () => {
    const f = setup();
    expect(() => assertVisualReview(f.reviewPath, f.reportPath, f.report)).toThrow(/pending/);
    f.review.status = 'PASS'; writeJson(f.reviewPath, f.review);
    expect(() => assertVisualReview(f.reviewPath, f.reportPath, f.report)).toThrow(/incomplete/);
    f.validReview(); expect(() => assertVisualReview(f.reviewPath, f.reportPath, f.report)).not.toThrow();
  });
  it.each(VISUAL_CHECKS)('blocks unchecked or unobserved checklist item %s', check => {
    const f = setup(); f.validReview(); f.review.checks[check].status = 'pending'; writeJson(f.reviewPath, f.review);
    expect(() => assertVisualReview(f.reviewPath, f.reportPath, f.report)).toThrow(check);
    f.review.checks[check] = {status: 'PASS', observation: 'PASS'}; writeJson(f.reviewPath, f.review);
    expect(() => assertVisualReview(f.reviewPath, f.reportPath, f.report)).toThrow(check);
  });
  it('blocks missing clip observation and stale report hash', () => {
    const f = setup(); f.validReview(); f.review.clips[0].observation = ''; writeJson(f.reviewPath, f.review);
    expect(() => assertVisualReview(f.reviewPath, f.reportPath, f.report)).toThrow(/observed/);
    f.validReview(); writeFileSync(f.reportPath, `${JSON.stringify(f.report)}\n\n`);
    expect(() => assertVisualReview(f.reviewPath, f.reportPath, f.report)).toThrow(/stale/);
  });
  it('reviews all used styles and allows short videos without eight invented semantic beats', () => {
    expect(selectDynamicBeats(board)).toHaveLength(2); expect(selectReviewBeats(board)).toHaveLength(2);
    const repeated = structuredClone(board); repeated.beats.push({...repeated.beats[0], id: 'three'});
    expect(selectDynamicBeats(repeated)).toHaveLength(2); expect(selectReviewBeats(repeated)).toHaveLength(3);
    expect(() => selectReviewBeats({...board, duration: 31})).toThrow(/eight/);
  });
});

