import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, isAbsolute, relative, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {StoryboardSchema, type Storyboard} from '../../packages/core/src/schema';

export const readSavedStoryboard = (file: string, canvas: {width: number; height: number; fps: number; duration: number}): Storyboard => {
  const value = StoryboardSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  if (value.width !== canvas.width || value.height !== canvas.height || value.fps !== Math.round(canvas.fps)
    || Math.abs(value.duration - canvas.duration) > 0.05) {
    throw new Error('Saved storyboard canvas/timeline differs from input; prepare a matching plan before continuing');
  }
  if (value.source.video !== 'input.mp4') throw new Error('Storyboard source.video must reference the continuous input.mp4 proxy');
  return value;
};

const inside = (root: string, name: string): string => {
  if (isAbsolute(name)) throw new Error('Subject pattern must be relative to public assets');
  const target = resolve(root, name), rel = relative(resolve(root), target);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Subject pattern escapes public assets');
  return target;
};

export const pngFacts = (data: Buffer): {width: number; height: number; hasAlpha: boolean} => {
  if (data.length < 33 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
    || data.subarray(12, 16).toString('ascii') !== 'IHDR') throw new Error('Subject asset is not a PNG');
  return {width: data.readUInt32BE(16), height: data.readUInt32BE(20), hasAlpha: data[25] === 4 || data[25] === 6};
};

/** Validate every frame and sample real alpha values; source alignment remains a visual-review obligation. */
export const prepareSubjectFrames = (storyboard: Storyboard, publicDir: string, sourceDir?: string): void => {
  const subject = storyboard.source.subject;
  if (!subject) {
    if (sourceDir) throw new Error('--subject-frames requires source.subject in the approved storyboard');
    return;
  }
  const expected = Math.round(storyboard.duration * storyboard.fps);
  if (subject.frameCount < expected) throw new Error('Subject sequence is shorter than the source timeline');
  const hashes: Array<{frame: number; file: string; sha256: string}> = [];
  for (let frame = 0; frame < expected; frame++) {
    const name = subject.pattern.replace('{frame}', String(frame).padStart(6, '0'));
    const destination = inside(publicDir, name);
    const input = sourceDir ? inside(sourceDir, `frame-${String(frame).padStart(6, '0')}.png`) : destination;
    if (!existsSync(input)) throw new Error(`Missing subject frame ${frame}: ${input}`);
    const data = readFileSync(input), facts = pngFacts(data);
    if (facts.width !== storyboard.width || facts.height !== storyboard.height || !facts.hasAlpha) {
      throw new Error(`Subject frame ${frame} requires source-sized RGBA/gray-alpha PNG`);
    }
    if (resolve(input) !== resolve(destination)) {mkdirSync(dirname(destination), {recursive: true}); copyFileSync(input, destination);}
    hashes.push({frame, file: name, sha256: createHash('sha256').update(data).digest('hex')});
  }
  let variedAlpha = false;
  for (const frame of [...new Set([0, Math.floor((expected - 1) / 2), expected - 1])]) {
    const file = inside(publicDir, hashes[frame].file);
    const result = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', 'alphaextract,signalstats,metadata=print:file=-', '-frames:v', '1', '-f', 'null', '-'], {encoding: 'utf8', windowsHide: true});
    if (result.status !== 0) throw new Error(`Subject alpha decode failed: ${result.stderr}`);
    const min = /YMIN=([0-9.]+)/.exec(result.stdout), max = /YMAX=([0-9.]+)/.exec(result.stdout);
    if (min && max && Number(min[1]) < Number(max[1])) variedAlpha = true;
  }
  if (!variedAlpha) throw new Error('Subject samples have no alpha variation; use a real transparent person layer');
  writeFileSync(resolve(publicDir, 'SUBJECT_MANIFEST.json'), `${JSON.stringify({type: 'png-sequence', frameCount: expected, sampledAlphaVariation: true, visualAlignmentReview: 'required', frames: hashes}, null, 2)}\n`);
};
