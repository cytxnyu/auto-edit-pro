import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
const root=resolve(import.meta.dirname,'..');
const read=(path:string)=>readFileSync(resolve(root,path),'utf8');
describe('public README integrity',()=>{
  it('links only existing local documentation',()=>{
    const links=[...read('README.md').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map(match=>match[1]).filter(link=>!/^https?:|^mailto:|^#/i.test(link));
    expect(links.length).toBeGreaterThan(10);
    for(const link of links)expect(existsSync(resolve(root,link.split('#')[0]))).toBe(true);
  });
  it('uses the requested repository and preserves attribution',()=>{
    expect(read('README.md')).toContain('https://github.com/cytxnyu/auto-edit-pro');
    expect(read('LICENSE')).toContain('Copyright (c) 2026 Nana AI');
    expect(read('NOTICE')).toContain('Copyright 2026 Nana AI');
  });
  it('documents synthetic fixtures without distributing private preview claims',()=>{
    expect(existsSync(resolve(root,'examples/synthetic-horizontal/input.srt'))).toBe(true);
    expect(read('docs/EXAMPLES.md')).toMatch(/合成|synthetic/i);
    expect(read('README.md')).not.toMatch(/!\[[^\]]*\]\(docs\/assets\/previews\//);
    expect(read('README.md')).not.toContain('业务微信');
  });
});
