import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {expect, it} from 'vitest';

it('runs Gate A through an installed directory junction rather than silently exiting', () => {
  const root = mkdtempSync(join(tmpdir(), 'stage-entry-'));
  const repo = resolve(import.meta.dirname, '..');
  const link = join(root, 'installed-skill');
  try {
    symlinkSync(repo, link, process.platform === 'win32' ? 'junction' : 'dir');
    const srt = join(root, 'input.srt'), out = join(root, 'job');
    writeFileSync(srt, '1\n00:00:00,000 --> 00:00:01,000\n把素材放大\n');
    const result = spawnSync(process.execPath, [join(repo, 'node_modules/tsx/dist/cli.mjs'), join(link, 'scripts/package-video.ts'), '--srt', srt, '--out', out, '--output-mode', 'overlay', '--width', '1920', '--height', '1080', '--fps', '30'], {cwd: link, encoding: 'utf8', windowsHide: true});
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Gate A complete:');
    expect(JSON.parse(readFileSync(join(out, 'storyboard.json'), 'utf8')).presentation).toBe('whole-screen-stage');
    expect(existsSync(join(out, 'renders'))).toBe(false);
  } finally {
    if (dirname(resolve(root)) !== resolve(tmpdir()) || !basename(root).startsWith('stage-entry-')) throw new Error('Unexpected test cleanup target');
    // Remove only the verified junction, never traverse the source checkout.
    if (existsSync(link)) {if (realpathSync(link) !== realpathSync(repo)) throw new Error('Unexpected junction target'); unlinkSync(link);}
    rmSync(root, {recursive: true, force: true});
  }
});
