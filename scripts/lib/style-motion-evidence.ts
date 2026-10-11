import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import type {Storyboard} from '../../packages/core/src/schema';
import type {VisualContract} from '../../packages/core/src/visual-contract';

type MotionEntry = VisualContract['beats'][number];
export type IsolatedMotionEvidence = {
  beatId: string; styleId: string; phase: MotionEntry['motion']['phase'];
  status: 'motion-detected' | 'quiet-reading-reviewed-separately';
  frames: {localFrame: number; file: string; sha256: string}[];
  delta: {changedPixels: number; meanChannelDelta: number};
};

export const selectProofFrames = (entry: MotionEntry): [number, number] => {
  const motion = entry.motion;
  const window = motion.phase === 'quiet-reading' ? entry.reading : motion.activeWindows.at(-1);
  if (!window || window.endFrame - window.startFrame < 2) throw new Error(`Motion proof needs two distinct frames: ${entry.beatId}`);
  const span = window.endFrame - window.startFrame - 1;
  const first = window.startFrame + Math.floor(span * (motion.phase === 'sustained' ? .55 : .15));
  return [first, Math.max(first + 1, window.startFrame + Math.ceil(span * .85))];
};
export const compareRgb = (a: Buffer, b: Buffer): IsolatedMotionEvidence['delta'] => {
  if (!a.length || a.length !== b.length || a.length % 3) throw new Error('Motion proof RGB buffers must have matching nonzero RGB24 dimensions');
  let changedPixels = 0; let total = 0;
  for (let offset = 0; offset < a.length; offset += 3) {
    let delta = 0;
    for (let channel = 0; channel < 3; channel++) delta += Math.abs(a[offset + channel] - b[offset + channel]);
    if (delta > 0) changedPixels++;
    total += delta;
  }
  return {changedPixels, meanChannelDelta: total / a.length};
};
export const assertMotionDelta = (entry: MotionEntry, delta: IsolatedMotionEvidence['delta']): IsolatedMotionEvidence['status'] => {
  if (entry.motion.phase === 'quiet-reading') return 'quiet-reading-reviewed-separately';
  if (delta.changedPixels <= 0) throw new Error(`Frozen packaging layer in declared active window: ${entry.beatId}. Recorded-video movement does not count as style motion.`);
  return 'motion-detected';
};
const run = (command: string, args: string[], cwd: string): Buffer => {
  const result = spawnSync(command, args, {cwd, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024, windowsHide: true});
  if (result.error || result.status !== 0) throw new Error(`Motion proof command failed (${result.status}): ${command} ${args.join(' ')}\n${result.error?.message ?? ''}\n${result.stderr?.toString('utf8')}`);
  return result.stdout;
};
export const renderIsolatedMotionEvidence = async ({storyboard, contract, selectedBeatIds, repo, publicDir, outDir}: {
  storyboard: Storyboard; contract: VisualContract; selectedBeatIds: string[]; repo: string; publicDir: string; outDir: string;
}): Promise<IsolatedMotionEvidence[]> => {
  const dir = resolve(outDir, 'isolated-motion'); mkdirSync(dir, {recursive: true});
  const results: IsolatedMotionEvidence[] = [];
  for (const [index, beatId] of selectedBeatIds.entries()) {
    const beat = storyboard.beats.find(item => item.id === beatId);
    const entry = contract.beats.find(item => item.beatId === beatId);
    if (!beat || !entry) throw new Error(`Isolated motion proof requires a saved contract beat: ${beatId}`);
    const prefix = String(index + 1).padStart(3, '0');
    const props = join(dir, `${prefix}-props.json`);
    writeFileSync(props, JSON.stringify({storyboard, beatId}), 'utf8');
    const frames = selectProofFrames(entry).map(localFrame => {
      const file = join(dir, `${prefix}-${localFrame}.png`);
      run(process.execPath, [join(repo, 'node_modules/@remotion/cli/remotion-cli.js'), 'still',
        join(repo, 'packages/remotion-renderer/src/index.ts'), 'StyleProof', file,
        '--frame', String(localFrame), '--props', props, '--public-dir', publicDir, '--overwrite'], repo);
      return {localFrame, file, sha256: createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()};
    });
    const pixels = frames.map(frame => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', frame.file,
      '-vf', 'scale=320:180:flags=area', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], repo));
    const delta = compareRgb(pixels[0], pixels[1]);
    results.push({beatId, styleId: entry.styleId, phase: entry.motion.phase, status: assertMotionDelta(entry, delta), frames, delta});
  }
  return results;
};
