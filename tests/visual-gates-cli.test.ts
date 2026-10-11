import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {readyVisualContractForTest} from './fixtures/visual-contract';

const repo = resolve(import.meta.dirname, '..');
const dirs: string[] = [];
const setup = () => {
  const dir = mkdtempSync(join(tmpdir(), 'visual-gates-cli-')); dirs.push(dir);
  const srt = join(dir, 'input.srt'); writeFileSync(srt, '1\n00:00:00,000 --> 00:00:02,000\n首先读取素材，然后分析，最后确认\n');
  const out = join(dir, 'out'); return {dir, out, args: ['--srt', srt, '--out', out, '--output-mode', 'overlay', '--width', '320', '--height', '180', '--fps', '30']};
};
const cli = (args: string[]) => spawnSync(process.execPath, [join(repo, 'node_modules/tsx/dist/cli.mjs'), join(repo, 'scripts/package-video.ts'), ...args], {cwd: repo, encoding: 'utf8', windowsHide: true});
const flags = ['--approve-gate-a', '--approve-gate-b'];
const readyA = (out: string, args: string[]) => {
  let result = cli(args); expect(result.status, result.stderr).toBe(0);
  const board = JSON.parse(readFileSync(join(out, 'storyboard.json'), 'utf8'));
  writeFileSync(join(out, 'visual-contract.json'), JSON.stringify(readyVisualContractForTest(board)));
  result = cli(args); expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain('Gate A locked with a ready visual contract');
  expect(result.stdout).not.toContain('Complete visual-contract.json');
  const approvals = JSON.parse(readFileSync(join(out, 'USER_APPROVALS.json'), 'utf8'));
  Object.assign(approvals.gateA, {status: 'approved', confirmationText: 'TEST ONLY: approve this exact synthetic plan', sourceRef: 'fixture-user-turn-1', confirmedAt: '2026-10-11T00:00:00Z'});
  writeFileSync(join(out, 'USER_APPROVALS.json'), JSON.stringify(approvals));
};
afterEach(() => {for (const dir of dirs.splice(0)) rmSync(dir, {recursive: true, force: true});});

describe('real CLI fail-closed sidecar integration', () => {
  it('allows explicit delegated A through B but still rejects D when C is missing', () => {
    const f = setup(); readyA(f.out, f.args);
    const path = join(f.out, 'USER_APPROVALS.json'); const approvals = JSON.parse(readFileSync(path, 'utf8'));
    Object.assign(approvals.delegation, {status: 'authorized', authorizationText: '这次不用我验收，你直接做出来后导出即可。', sourceRef: 'synthetic-user-turn-5', authorizedAt: '2026-10-11T00:00:00Z'});
    Object.assign(approvals.gateA, {status: 'approved', actor: 'agent', reviewer: 'fixture agent', reviewedAt: '2026-10-11T01:00:00Z', observation: 'Reviewed the current fixture source and complete plan before preparing composition inputs.'});
    writeFileSync(path, JSON.stringify(approvals));
    const prepared = cli([...f.args, ...flags, '--gate-b-only']); expect(prepared.status, prepared.stderr).toBe(0);
    const final = cli([...f.args, ...flags, '--approve-gate-d', '--render']);
    expect(final.status).not.toBe(0); expect(final.stderr).toContain('GATE_C_REPORT.json');
    expect(existsSync(join(f.out, 'renders'))).toBe(false);
    approvals.delegation.inputManifestSha256 = 'changed-source'; writeFileSync(path, JSON.stringify(approvals));
    const stale = cli([...f.args, ...flags, '--gate-b-only']); expect(stale.status).not.toBe(0); expect(stale.stderr).toContain('explicit verbatim user authorization');
  }, 30000);
  it('does not let flags synthesize a missing Gate A ledger', () => {
    const f = setup(); const result = cli([...f.args, ...flags, '--gate-b-only']);
    expect(result.status).not.toBe(0); expect(result.stderr).toContain('workflow ledger');
    expect(existsSync(join(f.out, 'props.json'))).toBe(false);
  }, 20000);
  it('requires relocking edited contracts and blocks D without C without regenerating evidence', () => {
    const f = setup(); readyA(f.out, f.args);
    let result = cli([...f.args, ...flags, '--gate-b-only']); expect(result.status, result.stderr).toBe(0);
    const props = readFileSync(join(f.out, 'props.json'), 'utf8');
    result = cli([...f.args, ...flags, '--approve-gate-d', '--render']);
    expect(result.status).not.toBe(0); expect(result.stderr).toContain('GATE_C_REPORT.json');
    expect(readFileSync(join(f.out, 'props.json'), 'utf8')).toBe(props);
    expect(existsSync(join(f.out, 'gate-c-review'))).toBe(false); expect(existsSync(join(f.out, 'renders'))).toBe(false);
    const contractPath = join(f.out, 'visual-contract.json'); writeFileSync(contractPath, `${readFileSync(contractPath, 'utf8')}\n`);
    result = cli([...f.args, ...flags, '--gate-b-only']); expect(result.status).not.toBe(0); expect(result.stderr).toContain('Gate A binding changed');
  }, 30000);
  it('resets prior user records on a fresh Gate A rather than silently reusing approval', () => {
    const f = setup(); readyA(f.out, f.args);
    const result = cli(f.args); expect(result.status, result.stderr).toBe(0);
    const approvals = JSON.parse(readFileSync(join(f.out, 'USER_APPROVALS.json'), 'utf8'));
    expect(approvals.gateA.status).toBe('pending'); expect(approvals.gateA.confirmationText).toBe('');
    const blocked = cli([...f.args, ...flags, '--gate-b-only']); expect(blocked.status).not.toBe(0); expect(blocked.stderr).toContain('CLI flags alone');
  }, 30000);
});
