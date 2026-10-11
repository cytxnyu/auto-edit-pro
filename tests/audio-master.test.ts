import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {probeAudioMaster} from '../scripts/lib/audio-master';
import {readyVisualContractForTest} from './fixtures/visual-contract';

const root = resolve(import.meta.dirname, '..');
const folders: string[] = [];
const temp = () => {const dir = mkdtempSync(join(tmpdir(), 'skill-audio-master-')); folders.push(dir); return dir;};
afterEach(() => {for (const dir of folders.splice(0)) {
  if (dirname(resolve(dir)) !== resolve(tmpdir()) || !basename(dir).startsWith('skill-audio-master-')) throw new Error('Unexpected test cleanup target');
  rmSync(dir, {recursive: true, force: true});
}});
const pcmWav = (seconds = 1) => {
  const samples = Math.round(seconds * 48000); const bytes = samples * 2;
  const wav = Buffer.alloc(44 + bytes);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + bytes, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(48000, 24); wav.writeUInt32LE(96000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(bytes, 40);
  return wav;
};
const cli = (args: string[]) => spawnSync(process.execPath, [join(root, 'node_modules/tsx/dist/cli.mjs'), join(root, 'scripts/package-video.ts'), ...args], {cwd: root, encoding: 'utf8', windowsHide: true});

describe('bound optional PCM audio master', () => {
  it('probes a PCM WAV and binds exact sample bytes rather than its filename', () => {
    const file = join(temp(), 'master.wav'); const bytes = pcmWav(); writeFileSync(file, bytes);
    const first = probeAudioMaster(file);
    expect(first).toMatchObject({duration: 1, size: bytes.length, codec: 'pcm_s16le', sampleRate: 48000, channels: 1});
    expect(first.sha256).toMatch(/^[A-F0-9]{64}$/);
    bytes.writeInt16LE(100, 44); writeFileSync(file, bytes);
    expect(probeAudioMaster(file).sha256).not.toBe(first.sha256);
  });
  it('rejects missing or undecodable masters', () => {
    const file = join(temp(), 'master.wav');
    expect(() => probeAudioMaster(file)).toThrow(/does not exist/);
    writeFileSync(file, 'not PCM media'); expect(() => probeAudioMaster(file)).toThrow();
  });
  it('rejects an overlay master and a valueless flag before execution', () => {
    const dir = temp(); const srt = join(dir, 'input.srt'); writeFileSync(srt, '1\n00:00:00,000 --> 00:00:01,000\n读取素材再确认\n');
    const args = ['--srt', srt, '--out', join(dir, 'out'), '--output-mode', 'overlay'];
    const invalid = cli([...args, '--audio-master']); expect(invalid.status).not.toBe(0); expect(invalid.stderr).toContain('Missing --audio-master');
    const overlay = cli([...args, '--audio-master', join(dir, 'master.wav')]); expect(overlay.status).not.toBe(0); expect(overlay.stderr).toContain('transparent overlay has no audio');
  }, 10000);
  it('binds master input through real Gate A/B and rejects removal or replacement', () => {
    const dir = temp(); const video = join(dir, 'source.mp4'); const srt = join(dir, 'input.srt'); const master = join(dir, 'master.wav'); const out = join(dir, 'out');
    const create = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=gray:s=320x180:r=30:d=1', '-c:v', 'libx264', '-threads', '1', '-pix_fmt', 'yuv420p', video], {encoding: 'utf8', windowsHide: true});
    expect(create.status, create.stderr).toBe(0);
    expect(() => probeAudioMaster(video)).toThrow(/one lossless PCM/);
    writeFileSync(srt, '1\n00:00:00,000 --> 00:00:01,000\n读取素材再确认\n'); writeFileSync(master, pcmWav());
    const base = ['--video', video, '--srt', srt, '--out', out, '--output-mode', 'composite']; const args = [...base, '--audio-master', master];
    let result = cli(args); expect(result.status, result.stderr).toBe(0);
    const manifest = JSON.parse(readFileSync(join(out, 'input-manifest.json'), 'utf8')); expect(manifest.audioMaster).toEqual(probeAudioMaster(master));
    const board = JSON.parse(readFileSync(join(out, 'storyboard.json'), 'utf8'));
    writeFileSync(join(out, 'visual-contract.json'), JSON.stringify(readyVisualContractForTest(board)));
    result = cli(args); expect(result.status, result.stderr).toBe(0);
    const approvalPath = join(out, 'USER_APPROVALS.json'); const approvals = JSON.parse(readFileSync(approvalPath, 'utf8'));
    Object.assign(approvals.gateA, {status: 'approved', actor: 'user', confirmationText: 'Fixture approval only', sourceRef: 'synthetic-master-test', confirmedAt: '2026-10-11T00:00:00Z'}); writeFileSync(approvalPath, JSON.stringify(approvals));
    const flags = ['--approve-gate-a', '--approve-gate-b', '--gate-b-only'];
    result = cli([...args, ...flags]); expect(result.status, result.stderr).toBe(0);
    result = cli([...base, ...flags]); expect(result.status).not.toBe(0); expect(result.stderr).toContain('Input changed since Gate A');
    const replacement = pcmWav(); replacement.writeInt16LE(100, 44); writeFileSync(master, replacement);
    result = cli([...args, ...flags]); expect(result.status).not.toBe(0); expect(result.stderr).toContain('Input changed since Gate A');
    expect(existsSync(join(out, 'renders'))).toBe(false);
  }, 30000);
});
