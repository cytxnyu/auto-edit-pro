import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {basename, dirname, join, resolve} from 'node:path';
import {copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {assertDirectorPlan} from '../packages/core/src/director-validation';
import {planStoryboard} from '../packages/core/src/planner';
import {probeMedia} from '../packages/core/src/probe';
import {gateABrief, storyboardMarkdown} from '../packages/core/src/reports';
import {parseSrt} from '../packages/core/src/srt';
import {parseStyleCliOptions} from '../packages/core/src/visual-styles';
import {assertVisualContract, createVisualContractTemplate} from '../packages/core/src/visual-contract';
import {generateHyperFramesProject} from '../packages/hyperframes-adapter/src/generate';
import {buildContactSheet, decodeEntireFile, detectBlackFrames, extractRepresentativeFrames, frameEvidenceFromFile, writeRenderManifest} from './lib/artifact-qa';
import {probeAudioMaster} from './lib/audio-master';
import {approvedGate, requireCumulativeApprovals, requireRenderAuthorization, type Args} from './lib/gates';
import {buildMasterAudioMuxArgs, buildOverlayFfmpegArgs, buildOverlaySequenceFlags, buildRemotionOutputFlags, resolveOutputMode, syntheticOverlayProbe} from './lib/output-mode';
import {prepareSubjectFrames, readSavedStoryboard} from './lib/stage-inputs';
import {renderIsolatedMotionEvidence} from './lib/style-motion-evidence';
import {approvalTemplate, assertGateCReport, assertLedger, assertUserApproval, assertVisualReview, digest, fileDigest, fileRecord, makeLedger, readJson, rendererFingerprint, resolveVisualAsset, reviewTemplate, selectDynamicBeats, selectReviewBeats, treeRecords, VISUAL_CHECKS, writeJson, type DynamicEvidence, type GateCReport} from './lib/visual-gates';

const parseArgs = (values: string[]): Args => {
  const args: Args = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) throw new Error(`Unexpected argument: ${value}`);
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else { args[key] = next; index += 1; }
  }
  return args;
};

const required = (args: Args, key: string): string => {
  const value = args[key];
  if (typeof value !== 'string' || !value) throw new Error(`Missing --${key}`);
  return value;
};

const sha256 = (path: string): string => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();

const run = (command: string, values: string[], cwd: string): void => {
  const result = spawnSync(command, values, {cwd, stdio: 'inherit', shell: false, windowsHide: true});
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status ?? 'unknown'}`);
};

const ensurePreviewMedia = (source: string, destination: string, codec: string, cwd: string): void => {
  if (codec === 'h264') {
    copyFileSync(source, destination);
    return;
  }
  run('ffmpeg', ['-y', '-v', 'warning', '-i', source, '-map', '0:v:0', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'fast', '-crf', '14', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', destination], cwd);
};

export const main = async (argv = process.argv.slice(2)): Promise<void> => {
  const args = parseArgs(argv);
  const styleOptions = parseStyleCliOptions(args);
  const hasStyleOverrides = ['style-mix', 'style-seed', 'style-pool'].some((key) => args[key] !== undefined);
  const srt = resolve(required(args, 'srt'));
  const out = resolve(required(args, 'out'));
  const video = typeof args.video === 'string' ? resolve(args.video) : undefined;
  const audioMaster = args['audio-master'] !== undefined ? resolve(required(args, 'audio-master')) : undefined;
  const outputMode = resolveOutputMode(args, video);
  if (audioMaster && outputMode !== 'composite') throw new Error('--audio-master applies only to composite output; transparent overlay has no audio');
  if (!existsSync(srt)) throw new Error('Input SRT does not exist');
  if (video && !existsSync(video)) throw new Error('Input video does not exist');
  const renderer = typeof args.renderer === 'string' ? args.renderer : 'remotion';
  const captionsMode = typeof args.captions === 'string' ? args.captions : 'burned-in';
  const renderConcurrency = typeof args.concurrency === 'string' ? args.concurrency : '2';
  const renderTimeout = typeof args.timeout === 'string' ? args.timeout : '120000';
  if (!['burned-in', 'none', 'generated'].includes(captionsMode)) throw new Error('Invalid --captions mode');
  if (!['remotion', 'hyperframes'].includes(renderer)) throw new Error('Invalid --renderer');
  if (renderer === 'hyperframes' && (styleOptions.styleMix === 'seeded-shuffle' || styleOptions.styleSeed !== undefined || styleOptions.stylePool !== undefined)) throw new Error('HyperFrames retains legacy visuals; style mixing requires --renderer remotion');
  if (renderer === 'hyperframes' && outputMode === 'overlay') throw new Error('Overlay MOV output currently requires --renderer remotion');
  if (!/^[1-9]\d*$/.test(renderConcurrency) || Number(renderConcurrency) > 16) throw new Error('Invalid --concurrency; expected an integer from 1 to 16');
  if (!/^[1-9]\d*$/.test(renderTimeout) || Number(renderTimeout) < 7000) throw new Error('Invalid --timeout; expected an integer of at least 7000 milliseconds');

  const cues = parseSrt(readFileSync(srt, 'utf8'));
  const width = Number(typeof args.width === 'string' ? args.width : 1920);
  const height = Number(typeof args.height === 'string' ? args.height : 1080);
  const fps = Number(typeof args.fps === 'string' ? args.fps : 30);
  mkdirSync(out, {recursive: true});
  const probe = video ? probeMedia(video) : syntheticOverlayProbe({cues, width, height, fps});
  const audioMasterRecord = audioMaster ? probeAudioMaster(audioMaster) : null;
  if (audioMasterRecord && Math.abs(audioMasterRecord.duration - probe.duration) > 2 / probe.video.fps) throw new Error('Audio master duration must match the edited video within two frames');
  const gate = approvedGate(args);
  const repo = resolve(import.meta.dirname, '..');
  const contractPath = typeof args['visual-contract'] === 'string' ? resolve(args['visual-contract']) : join(out, 'visual-contract.json');
  const reviewPath = typeof args['visual-review'] === 'string' ? resolve(args['visual-review']) : join(out, 'VISUAL_REVIEW.json');
  const approvalsPath = typeof args['user-approvals'] === 'string' ? resolve(args['user-approvals']) : join(out, 'USER_APPROVALS.json');
  const ledgerPath = join(out, 'WORKFLOW_LEDGER.json');
  const reportPath = join(out, 'GATE_C_REPORT.json');
  const storyboardFile = typeof args.storyboard === 'string' ? resolve(args.storyboard)
    : (!hasStyleOverrides || gate !== 'A') && existsSync(join(out, 'storyboard.json')) ? join(out, 'storyboard.json') : undefined;
  if (gate !== 'A' && (!storyboardFile || !existsSync(ledgerPath))) throw new Error('Gate A workflow ledger and saved storyboard are required before Gate B/C/D; CLI flags cannot create prior approval');
  if (storyboardFile && hasStyleOverrides) throw new Error('Saved storyboard preserves its visual style choices; remove --style-mix/--style-seed/--style-pool overrides or create a new Gate A plan');
  const previousManifest = join(out, 'input-manifest.json');
  if (gate !== 'A' && existsSync(previousManifest)) {
    const previous = JSON.parse(readFileSync(previousManifest, 'utf8'));
    if (previous.srt?.sha256 !== sha256(srt) || (video ? previous.video?.sha256 !== sha256(video) : previous.video !== null) || (audioMasterRecord ? previous.audioMaster?.sha256 !== audioMasterRecord.sha256 : previous.audioMaster != null)) {
      throw new Error('Input changed since Gate A; prepare a new matching plan before continuing');
    }
  }
  const id = typeof args.id === 'string' ? args.id : basename(out).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video-package';
  const storyboard = storyboardFile ? readSavedStoryboard(storyboardFile, {width: probe.video.width, height: probe.video.height, fps: probe.video.fps, duration: probe.duration})
    : planStoryboard({id, title: typeof args.title === 'string' ? args.title : id, cues, probe, captionsMode: captionsMode as 'burned-in' | 'none' | 'generated', sourceVideo: 'input.mp4', sourceSrt: 'input.srt', presentation: renderer === 'hyperframes' ? 'legacy' : 'whole-screen-stage', ...styleOptions});
  if (renderer === 'hyperframes' && storyboard.beats.some((beat) => beat.stage)) throw new Error('Whole-screen stage uses Remotion; HyperFrames retains the original legacy layouts');
  if (outputMode === 'overlay' && storyboard.source.subject) throw new Error('A person cutout is a composite layer; export the transparent graphics without source.subject for overlay-only delivery');
  assertDirectorPlan(storyboard);
  const storyboardJson = `${JSON.stringify(storyboard, null, 2)}\n`;
  const inputManifest = {
    outputMode,
    video: video ? {sha256: sha256(video), size: probe.size, duration: probe.duration, codec: probe.video.codec} : null,
    audioMaster: audioMasterRecord,
    canvas: {width: probe.video.width, height: probe.video.height, fps: probe.video.fps, duration: probe.duration},
    srt: {sha256: sha256(srt), cues: cues.length},
  };
  const inputManifestJson = `${JSON.stringify(inputManifest, null, 2)}\n`;

  if (gate === 'A' && !existsSync(contractPath)) writeJson(contractPath, createVisualContractTemplate(storyboard));
  let contract = readJson(contractPath);
  if (gate !== 'A' || contract.status === 'ready') contract = assertVisualContract(storyboard, contract);
  const pathKey = (path: string) => path.replace(/\\/g, '/').toLowerCase();
  const assetBindings = (Array.isArray(contract.assets) ? contract.assets : []).map((asset: {id: string; path: string; kind: string}) => {
    if (asset.kind === 'source-media' && pathKey(asset.path) === pathKey(storyboard.source.video)) return {id: asset.id, path: asset.path, sha256: video ? sha256(video) : `SRT_ONLY_PLACEHOLDER:${sha256(srt)}`};
    const candidates = [resolve(dirname(contractPath), asset.path), resolve(out, 'public', asset.path)];
    const record = resolveVisualAsset(candidates);
    if (!record && (gate !== 'A' || contract.status === 'ready')) throw new Error(`Visual contract asset is missing: ${asset.id} (${asset.path})`);
    return {id: asset.id, path: asset.path, sha256: record?.sha256 ?? 'MISSING_DRAFT_ASSET'};
  });
  const binding = {jobId: out, inputManifestSha256: digest(inputManifestJson), storyboardSha256: digest(storyboardJson), visualContractSha256: fileDigest(contractPath), visualAssetsSha256: digest(JSON.stringify(assetBindings)), rendererFingerprint: rendererFingerprint(repo), renderer, outputMode};

  if (args.render === true && gate !== 'D') requireRenderAuthorization(args);
  if (gate === 'A') {
    writeFileSync(join(out, 'BRIEF.md'), gateABrief({storyboard, probe, cues}), 'utf8');
    writeJson(join(out, 'SOURCE_PROBE.json'), probe);
    writeFileSync(join(out, 'STORYBOARD.md'), storyboardMarkdown(storyboard), 'utf8');
    writeFileSync(join(out, 'storyboard.json'), storyboardJson, 'utf8');
    writeFileSync(join(out, 'input-manifest.json'), inputManifestJson, 'utf8');
    const ledger = makeLedger(binding);
    writeJson(ledgerPath, ledger);
    // A fresh plan never inherits a prior user approval, even if its bytes happen to match.
    writeJson(approvalsPath, approvalTemplate(ledger));
    process.stdout.write(`Gate A complete: ${out}\n`);
    process.stdout.write(contract.status === 'ready'
      ? `Gate A locked with a ready visual contract. Record this job's explicit user confirmation in ${approvalsPath}; then continue to Gate B/C without rerunning Gate A.\n`
      : `Complete visual-contract.json, rerun Gate A, then record this job's explicit user confirmation in ${approvalsPath}. Pending templates do not authorize execution.\n`);
    return;
  }
  requireCumulativeApprovals(args, gate);
  const ledger = assertLedger(ledgerPath, binding);
  if (fileDigest(join(out, 'storyboard.json')) !== binding.storyboardSha256 || fileDigest(join(out, 'input-manifest.json')) !== binding.inputManifestSha256) throw new Error('Saved Gate A files changed; replan and reapprove before execution');
  assertUserApproval(approvalsPath, 'gateA', ledger);
  const publicDir = join(out, 'public');
  const propsPath = join(out, 'props.json');
  const propsJson = `${JSON.stringify({storyboard, cues, overlayOnly: outputMode === 'overlay'}, null, 2)}\n`;
  if (gate === 'D') {
    requireRenderAuthorization(args);
    const report = assertGateCReport(reportPath, ledger, storyboard, propsPath, publicDir, contract);
    if (readFileSync(propsPath, 'utf8') !== propsJson) throw new Error('Gate C props do not match the locked storyboard and source cues');
    assertVisualReview(reviewPath, reportPath, report);
    assertUserApproval(approvalsPath, 'gateD', ledger, fileDigest(reportPath), {reportFile: reportPath, reviewFile: reviewPath, report});
    // Deliberately read only: regenerating C here would invalidate the evidence the user reviewed.
  } else {
    mkdirSync(publicDir, {recursive: true});
    if (video) ensurePreviewMedia(video, join(publicDir, 'input.mp4'), probe.video.codec, repo);
    copyFileSync(srt, join(publicDir, 'input.srt'));
    prepareSubjectFrames(storyboard, publicDir, typeof args['subject-frames'] === 'string' ? resolve(args['subject-frames']) : undefined);
    writeFileSync(propsPath, propsJson, 'utf8');
  }

  if (renderer === 'hyperframes' && gate !== 'D') {
    const project = generateHyperFramesProject(storyboard);
    const target = join(out, 'hyperframes');
    mkdirSync(target, {recursive: true});
    writeFileSync(join(target, 'index.html'), project.html, 'utf8');
    writeFileSync(join(target, 'index.motion.json'), `${JSON.stringify(project.motion, null, 2)}\n`, 'utf8');
    if (video) copyFileSync(join(publicDir, 'input.mp4'), join(target, 'input.mp4'));
  }

  if (gate === 'B') {
    process.stdout.write(`Gate B composition inputs ready: ${out}\n`);
    return;
  }
  if (renderer !== 'remotion') throw new Error('Gate C review stills and Gate D final rendering currently require --renderer remotion');

  const entry = join(repo, 'packages', 'remotion-renderer', 'src', 'index.ts');
  if (gate === 'C') {
  const reviewPublicBefore = treeRecords(publicDir);
  const reviewDir = join(out, 'gate-c-review');
  mkdirSync(reviewDir, {recursive: true});
  const reviewFrames = selectReviewBeats(storyboard).map((beat, index) => {
    const file = join(reviewDir, `${String(index + 1).padStart(2, '0')}-${beat.structure}-${beat.timestamp.toFixed(3)}s.png`);
    run(process.execPath, [join(repo, 'node_modules', '@remotion', 'cli', 'remotion-cli.js'), 'still', entry, 'VideoPackaging', file, '--frame', String(Math.round(beat.timestamp * storyboard.fps)), '--props', propsPath, '--public-dir', publicDir, '--overwrite'], repo);
    return frameEvidenceFromFile(beat, file);
  });
  const reviewContact = buildContactSheet(reviewFrames, join(reviewDir, 'contact-sheet.jpg'));
  const clips: DynamicEvidence[] = selectDynamicBeats(storyboard).map(selection => {
    const file = join(reviewDir, `${selection.id}.mp4`);
    run(process.execPath, [join(repo, 'node_modules', '@remotion', 'cli', 'remotion-cli.js'), 'render', entry, 'VideoPackaging', file, '--frames', `${selection.startFrame}-${selection.endFrame}`, '--props', propsPath, '--public-dir', publicDir, ...buildRemotionOutputFlags('composite'), '--concurrency', renderConcurrency, '--timeout', renderTimeout, '--overwrite'], repo);
    decodeEntireFile(file);
    const clipProbe = probeMedia(file);
    return {...selection, ...fileRecord(file), width: clipProbe.video.width, height: clipProbe.video.height, fps: clipProbe.video.fps, duration: clipProbe.duration, decoded: true};
  });
  const isolatedMotion = await renderIsolatedMotionEvidence({storyboard, contract, selectedBeatIds: clips.map(clip => clip.beatId), repo, publicDir, outDir: reviewDir});
  const report: GateCReport = {version: 1, status: 'manual-review-required', bindingSha256: ledger.bindingSha256, rendererFingerprint: binding.rendererFingerprint, composition: 'VideoPackaging', props: fileRecord(propsPath), publicFiles: treeRecords(publicDir), frames: reviewFrames.map(frame => fileRecord(frame.file)), contactSheet: fileRecord(reviewContact), clips, isolatedMotion, blockingChecklist: VISUAL_CHECKS};
  if (rendererFingerprint(repo) !== binding.rendererFingerprint || JSON.stringify(reviewPublicBefore) !== JSON.stringify(report.publicFiles)) throw new Error('Renderer or public media changed while Gate C rendered; discard mixed evidence and rerun the workflow');
  writeJson(reportPath, report);
  writeJson(reviewPath, reviewTemplate(report, fileDigest(reportPath)));
    process.stdout.write(`Gate C review ready; no final video rendered: ${reviewContact}\n`);
    process.stdout.write(`Review all ${clips.length} real composition dynamic clips and complete ${reviewPath}; every used style must have observed evidence.\n`);
    return;
  }

  requireRenderAuthorization(args);
  const renders = join(out, 'renders');
  mkdirSync(renders, {recursive: true});
  const output = join(renders, outputMode === 'overlay' ? 'overlay.mov' : 'packaged.mp4');
  const remotionCli = join(repo, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
  if (outputMode === 'overlay') {
    const sequenceDir = mkdtempSync(join(tmpdir(), 'ai-self-media-overlay-'));
    try {
      const sequenceArgs = [remotionCli, 'render', entry, 'VideoPackaging', sequenceDir, '--props', propsPath, '--public-dir', publicDir];
      sequenceArgs.push(...buildOverlaySequenceFlags(), '--concurrency', renderConcurrency, '--timeout', renderTimeout, '--overwrite');
      run(process.execPath, sequenceArgs, repo);
      run('ffmpeg', buildOverlayFfmpegArgs({
        sequenceDir,
        output,
        fps: storyboard.fps,
        totalFrames: Math.round(storyboard.duration * storyboard.fps),
      }), repo);
    } finally {
      rmSync(sequenceDir, {recursive: true, force: true});
    }
  } else {
    const videoOutput = audioMaster ? join(renders, 'video-master-silent.mp4') : output;
    const renderArgs = [remotionCli, 'render', entry, 'VideoPackaging', videoOutput, '--props', propsPath, '--public-dir', publicDir];
    renderArgs.push(...buildRemotionOutputFlags(outputMode));
    if (audioMaster) renderArgs.push('--muted');
    renderArgs.push('--concurrency', renderConcurrency, '--timeout', renderTimeout, '--disallow-parallel-encoding', '--overwrite');
    run(process.execPath, renderArgs, repo);
    if (audioMaster) {
      if (fileDigest(audioMaster) !== audioMasterRecord!.sha256) throw new Error('Audio master changed while rendering');
      run('ffmpeg', buildMasterAudioMuxArgs({video: videoOutput, audioMaster, output, duration: Math.round(storyboard.duration * storyboard.fps) / storyboard.fps}), repo);
    }
  }
  decodeEntireFile(output);
  const finalFrames = extractRepresentativeFrames(output, storyboard, join(renders, 'qa-frames'));
  buildContactSheet(finalFrames, join(renders, 'contact-sheet.jpg'));
  const manifest = writeRenderManifest({output, storyboard, frames: finalFrames, target: join(out, 'RENDER_MANIFEST.json'), outputMode});
  if (outputMode === 'composite') {
    const blackFrames = detectBlackFrames(output);
    if (blackFrames.length > 0) throw new Error(`Artifact QA failed: detected ${blackFrames.length} black segment(s)`);
  }
  if (rendererFingerprint(repo) !== binding.rendererFingerprint) throw new Error('Renderer source changed during final render; current artifact has not passed the locked workflow');
  const currentReport = assertGateCReport(reportPath, ledger, storyboard, propsPath, publicDir, contract);
  assertVisualReview(reviewPath, reportPath, currentReport);
  assertUserApproval(approvalsPath, 'gateD', ledger, fileDigest(reportPath), {reportFile: reportPath, reviewFile: reviewPath, report: currentReport});
  writeJson(join(out, 'RENDER_MANIFEST.json'), {...manifest, workflow: {ledger: fileRecord(ledgerPath), visualContract: fileRecord(contractPath), gateCReport: fileRecord(reportPath), visualReview: fileRecord(reviewPath), userApprovals: fileRecord(approvalsPath)}});
  process.stdout.write(`Gate D render complete: ${output}\nSHA-256: ${manifest.output.sha256}\n`);
};

const isDirect = process.argv[1] && existsSync(process.argv[1])
  && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));
if (isDirect) await main();
