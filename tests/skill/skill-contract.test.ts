import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {SEMANTIC_STRUCTURES} from '../../packages/core/src/template-contracts';
import {VISUAL_STYLE_IDS} from '../../packages/core/src/visual-styles';

const skill = readFileSync('SKILL.md', 'utf8');
const readme = readFileSync('README.md', 'utf8');

describe('public Skill contract', () => {
  it('documents global single-use and exact-job opt-in delegation without relaxing Gate C', () => {
    for (const phrase of ['One scene, one style', "styleMix.usage:'single-use'", 'Pool exhaustion blocks planning', 'all 15 checks', "actor:'agent'", 'input-manifest hash']) expect(skill).toContain(phrase);
    const gates = readFileSync('references/gates.md', 'utf8');
    for (const phrase of ['authorizationKind', 'explicit-skip-user-review-and-export', 'review-and-export-current-job', 'visualReviewSha256', 'reviewer', 'another output job']) expect(gates).toContain(phrase);
    const mix = readFileSync('references/visual-style-mixing.md', 'utf8');
    expect(mix).toContain('风格在全片只出现一次');
    expect(mix).not.toContain('单项池允许重复');
  });
  it('contains every pressure-tested safety boundary', () => {
    for (const phrase of ['Gate A', 'burned-in', 'evidence', 'frame-driven', 'component gallery', 'line illustrations', 'Present the plan first', 'Do not continue until']) {
      expect(skill).toContain(phrase);
    }
  });

  it('keeps the trigger-only frontmatter concise', () => {
    expect(skill).toMatch(/^---\nname: auto-edit-pro\ndescription: Use when /);
  });

  it('teaches the multicolor center-presenter layout and approval contract', () => {
    const normalized = skill.toLowerCase();
    for (const phrase of [
      'center-presenter',
      'whole screen is the stage',
      'keyword',
      'full-screen',
      '1.6–3.2 seconds',
      'seeded-shuffle',
      'programmatic line illustrations',
      'Do not continue until the user approves',
    ]) {
      expect(normalized).toContain(phrase.toLowerCase());
    }
  });

  it('documents executable mixed styles, frozen legacy plans and synthetic-only examples', () => {
    for (const phrase of ['balatro', 'crt-warp', 'cubes', 'hyperspeed', 'reopens and renders do not reshuffle', '--style-mix legacy', 'npm run demo:styles', 'does not approve Gate A or Gate D for any real video']) expect(skill).toContain(phrase);
    const reference = readFileSync('references/visual-style-mixing.md', 'utf8');
    for (const phrase of ['--style-seed', '--style-pool', '本地原创', '尚未注册', 'surface: "transparent"']) expect(reference).toContain(phrase);
    expect(VISUAL_STYLE_IDS).toHaveLength(71);
    for (const id of VISUAL_STYLE_IDS.slice(0,21)) {
      expect(skill).toContain(`\`${id}\``);
      expect(reference).toContain(`\`${id}\` / [`);
      expect(reference).toMatch(new RegExp(`https://reactbits\\.dev/(?:backgrounds|animations|components)/${id}\\)`));
    }
    expect(reference).toContain('已保存的四风格池与旧配色保持不变');
    expect(skill).toContain('references/react-bits-catalog.md');
    const catalog = readFileSync('references/react-bits-catalog.md','utf8');
    for(const id of VISUAL_STYLE_IDS.slice(21)) expect(catalog).toContain('`'+id+'`');
    expect(reference).toContain('不额外插入无意义镜头');
    expect(reference).toContain('波纹与金属涂层不作用于证据正文');
    expect(skill).toContain('A style-upgrade-only request does not also request presentation examples');
  });

  it('uses bounded local render concurrency for 1080p talking-head footage', () => {
    const packagingScript = readFileSync('scripts/package-video.ts', 'utf8');
    expect(packagingScript).toContain("const renderConcurrency = typeof args.concurrency === 'string' ? args.concurrency : '2'");
    expect(packagingScript).toContain("'--concurrency', renderConcurrency");
  });

  it('defines blocking visual QA for center safety, content density, and real review frames', () => {
    for (const phrase of [
      'translucent overlays',
      'content-fit',
      'partial or complete face/body coverage is valid',
      '72%',
      'manual frame review',
      'blocks Gate D',
    ]) expect(skill.toLowerCase()).toContain(phrase.toLowerCase());
    expect(skill).toContain('references/visual-quality-gates.md');
  });

  it('documents the ten V2 structures and cumulative four-gate flow', () => {
    for (const name of SEMANTIC_STRUCTURES) expect(skill).toContain(name);
    for (const flag of ['--approve-gate-a', '--approve-gate-b', '--approve-gate-c', '--approve-gate-d']) {
      expect(skill).toContain(flag);
    }
    expect(skill).toContain('source frames');
    expect(skill).toContain('transparent foreground person layer');
    expect(skill).toContain('Remotion by default');
    expect(skill).toContain('HyperFrames adapter');
  });

  it('teaches first-time users the two real input and output workflows', () => {
    for (const phrase of [
      '前期素材准备',
      '不处理重读、漏读和气口',
      '视频 + SRT',
      '只提供 SRT',
      '透明 MOV',
      '直接合成 MP4',
      '--output-mode overlay',
      '--output-mode composite',
      '默认推荐',
    ]) expect(readme).toContain(phrase);
  });

  it('explains subtitle choices in plain Chinese instead of editor jargon', () => {
    for (const phrase of [
      '原视频已经带有字幕（字幕已固定在画面中）',
      '原视频没有字幕，希望 Skill 自动生成字幕',
      '原视频没有字幕，并且只需要动效、不需要字幕',
    ]) expect(readme).toContain(phrase);
    expect(readme).not.toContain('已烧录字幕');
    expect(readme).not.toContain('烧录字幕');
  });

  it('identifies the requested public repository and original license', () => {
    expect(readme).toContain('https://github.com/cytxnyu/auto-edit-pro');
    expect(readFileSync('LICENSE', 'utf8')).toContain('Copyright (c) 2026 Nana AI');
    expect(readFileSync('NOTICE', 'utf8')).toContain('Copyright 2026 Nana AI');
  });
});
