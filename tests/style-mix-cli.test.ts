import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {VISUAL_STYLE_IDS} from '../packages/core/src/visual-styles';
import {readyVisualContractForTest} from './fixtures/visual-contract';

const repo = resolve(import.meta.dirname, '..');
const folders: string[] = [];
const prepare = () => {
  const dir = mkdtempSync(join(tmpdir(), 'auto-edit-pro-style-cli-'));
  folders.push(dir);
  const srt = join(dir, 'input.srt');
  writeFileSync(srt, '1\n00:00:00,000 --> 00:00:02,000\n为什么总要重复操作\n\n2\n00:00:02,000 --> 00:00:04,000\n首先读取素材，然后分析，最后确认\n\n3\n00:00:04,000 --> 00:00:06,000\n运行检查、审核方案、确认导出\n\n4\n00:00:06,000 --> 00:00:08,000\n输入素材，AI生成视频，人再反馈修正\n');
  const out = join(dir, 'run');
  const args = ['--srt', srt, '--out', out, '--output-mode', 'overlay', '--width', '640', '--height', '360', '--fps', '30'];
  return {dir, out, args};
};
const cli = (args: string[]) => spawnSync(process.execPath, [join(repo, 'node_modules/tsx/dist/cli.mjs'), join(repo, 'scripts/package-video.ts'), ...args], {cwd: repo, encoding: 'utf8', windowsHide: true});
const recordFixtureApproval = (out: string, args: string[]) => {
  const board = JSON.parse(readFileSync(join(out, 'storyboard.json'), 'utf8'));
  writeFileSync(join(out, 'visual-contract.json'), `${JSON.stringify(readyVisualContractForTest(board), null, 2)}\n`);
  const relock = cli(args);
  expect(relock.status, relock.stderr).toBe(0);
  const approvals = JSON.parse(readFileSync(join(out, 'USER_APPROVALS.json'), 'utf8'));
  Object.assign(approvals.gateA, {status: 'approved', confirmationText: 'TEST FIXTURE: execute this exact synthetic plan', sourceRef: 'synthetic-cli-test-approval', confirmedAt: '2026-10-11T00:00:00Z'});
  writeFileSync(join(out, 'USER_APPROVALS.json'), `${JSON.stringify(approvals, null, 2)}\n`);
};
afterEach(() => {for (const folder of folders.splice(0)) rmSync(folder, {recursive: true, force: true});});

describe('style mix CLI integration', () => {
  it('writes a seeded Gate A plan, keeps its choices through Gate B and produces no final video', () => {
    const {out, args} = prepare();
    const result = cli([...args, '--style-seed', '29']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Gate A complete:');
    const original = readFileSync(join(out, 'storyboard.json'), 'utf8');
    const board = JSON.parse(original);
    expect(board.styleMix).toEqual({mode: 'seeded-shuffle', usage: 'single-use', seed: 29, pool: [...VISUAL_STYLE_IDS]});
    expect(board.styleMix.pool).toHaveLength(71);
    expect(board.beats).toHaveLength(4);
    expect(new Set(board.beats.map((beat: {visualStyle: {id: string}}) => beat.visualStyle.id)).size).toBe(4);
    const flagsOnly = cli([...args, '--approve-gate-a', '--approve-gate-b', '--gate-b-only']);
    expect(flagsOnly.status).not.toBe(0);
    expect(existsSync(join(out, 'props.json'))).toBe(false);
    recordFixtureApproval(out, args);
    const continued = cli([...args, '--approve-gate-a', '--approve-gate-b', '--gate-b-only']);
    expect(continued.status, continued.stderr).toBe(0);
    expect(continued.stdout).toContain('Gate B composition inputs ready:');
    expect(readFileSync(join(out, 'storyboard.json'), 'utf8')).toBe(original);
    expect(JSON.parse(readFileSync(join(out, 'props.json'), 'utf8')).storyboard).toEqual(board);
    expect(existsSync(join(out, 'renders'))).toBe(false);
    const overridden = cli([...args, '--approve-gate-a', '--approve-gate-b', '--gate-b-only', '--style-seed', '30']);
    expect(overridden.status).not.toBe(0);
    expect(overridden.stderr).toContain('Saved storyboard preserves its visual style choices');
    expect(readFileSync(join(out, 'storyboard.json'), 'utf8')).toBe(original);
  }, 20000);
  it('supports a subset and legacy mode without inventing styles on old plans', () => {
    const {out, args} = prepare();
    let result = cli([...args, '--style-seed', '0', '--style-pool', 'cubes,balatro']);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Single-use style pool exhausted');
    result = cli([...args, '--style-seed', '0', '--style-pool', 'cubes,balatro,hyperspeed,crt-warp']);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(out, 'storyboard.json'), 'utf8')).styleMix.pool).toEqual(['cubes', 'balatro', 'hyperspeed', 'crt-warp']);
    result = cli([...args, '--style-mix', 'legacy']);
    expect(result.status, result.stderr).toBe(0);
    const board = JSON.parse(readFileSync(join(out, 'storyboard.json'), 'utf8'));
    expect(board.styleMix).toBeUndefined();
    expect(board.beats.every((b: {visualStyle?: unknown; palette: string}) => !b.visualStyle && !([...VISUAL_STYLE_IDS] as string[]).includes(b.palette))).toBe(true);
  }, 20000);
  it('preserves saved four-style plans even though the new default pool contains 71 styles', () => {
    const {out, args} = prepare();
    const result = cli([...args, '--style-seed', '29', '--style-pool', 'balatro,crt-warp,cubes,hyperspeed']);
    expect(result.status, result.stderr).toBe(0);
    const saved = readFileSync(join(out, 'storyboard.json'), 'utf8');
    const board = JSON.parse(saved);
    expect(board.styleMix.pool).toEqual(['balatro', 'crt-warp', 'cubes', 'hyperspeed']);
    expect(board.beats.map((b: {visualStyle: {id: string}}) => b.visualStyle.id)).toEqual(['crt-warp', 'cubes', 'hyperspeed', 'balatro']);
    const flagsOnly = cli([...args, '--approve-gate-a', '--approve-gate-b', '--gate-b-only']);
    expect(flagsOnly.status).not.toBe(0);
    recordFixtureApproval(out, args);
    const continued = cli([...args, '--approve-gate-a', '--approve-gate-b', '--gate-b-only']);
    expect(continued.status, continued.stderr).toBe(0);
    expect(readFileSync(join(out, 'storyboard.json'), 'utf8')).toBe(saved);
  }, 20000);
  it.each(VISUAL_STYLE_IDS.slice(4))('plans new style %s through the actual Gate A CLI', id => {
    const {out, args} = prepare();
    // A one-style pool is a one-scene example, never repeated throughout a film.
    writeFileSync(args[1], '1\n00:00:00,000 --> 00:00:02,000\n运行检查、审核方案、确认导出\n');
    const result = cli([...args, '--style-seed', '0', '--style-pool', id]);
    expect(result.status, result.stderr).toBe(0);
    const board = JSON.parse(readFileSync(join(out, 'storyboard.json'), 'utf8'));
    expect(board.styleMix.pool).toEqual([id]);
    expect(board.beats.every((b: {palette: string; visualStyle: {id: string}}) => b.palette === id && b.visualStyle.id === id)).toBe(true);
    expect(existsSync(join(out, 'renders'))).toBe(false);
  }, 20000);
  it('rejects invalid seed/pool early and explicit HyperFrames new-style requests', () => {
    const {out, args} = prepare();
    for (const options of [['--style-seed', '-1'], ['--style-pool', 'balatro,balatro'], ['--renderer', 'hyperframes', '--style-mix', 'seeded-shuffle']]) {
      const result = cli([...args, ...options]);
      expect(result.status).not.toBe(0);
      expect(existsSync(out)).toBe(false);
    }
  }, 20000);
});
