import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {VISUAL_STYLE_IDS} from '../../core/src/visual-styles';
import {PALETTES} from '../../core/src/palettes';
import {REGISTERED_STYLE_IDS,StyleBackdrop,styleMaterial} from '../src/styles';
import {StageContext} from '../src/stage/context';
import {CommandPalette} from '../src/structures/v2/CommandPalette';
const luminance=(hex:string)=>{
  const c=hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return c[0]*.2126+c[1]*.7152+c[2]*.0722;
};
describe('complete 71-style executable registry',()=>{
  it('keeps all four 0.3.0 effect frames and materials byte-identical',()=>{
    const original=JSON.parse(readFileSync(new URL('../../../tests/fixtures/four-style-0.3.0-hashes.json',import.meta.url),'utf8'));
    for(const id of ['balatro','crt-warp','cubes','hyperspeed'] as const){
      const html=renderToStaticMarkup(<StyleBackdrop style={{id,seed:4221,intensity:.7}} frame={27} fps={30} width={1280} height={720}/>);
      expect(createHash('sha256').update(html).digest('hex')).toBe(original[id].markupSha256);
      expect(styleMaterial(id)).toEqual(original[id].material);
    }
  });
  it('preserves all 21 version-0.4.0 effect frames, semantic palettes and materials',()=>{
    const saved=JSON.parse(readFileSync(new URL('../../../tests/fixtures/21-style-0.4.0-hashes.json',import.meta.url),'utf8'));
    expect(Object.keys(saved)).toHaveLength(21);
    for(const id of VISUAL_STYLE_IDS.slice(0,21)){
      const html=renderToStaticMarkup(<StyleBackdrop style={{id,seed:4221,intensity:.7}} frame={27} fps={30} width={1280} height={720}/>);
      expect(createHash('sha256').update(html).digest('hex'),id).toBe(saved[id].markupSha256);
      expect(styleMaterial(id),id).toEqual(saved[id].material);
      expect(PALETTES[id],id).toEqual(saved[id].palette);
    }
  });
  it('registers exactly all canonical IDs without aliases or fallback effects',()=>{
    expect(VISUAL_STYLE_IDS).toHaveLength(71);
    expect(new Set(REGISTERED_STYLE_IDS)).toEqual(new Set(VISUAL_STYLE_IDS));
  });
  it.each(VISUAL_STYLE_IDS)('%s has actual geometry, material, palette and semantic content integration',id=>{
    const p=PALETTES[id],m=styleMaterial(id);
    expect(m.radius).toBeGreaterThanOrEqual(0);
    expect(m.borderWidth).toBeGreaterThan(0);
    const fg=luminance(p.foreground),bg=luminance(p.card);
    expect((Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)).toBeGreaterThan(4.5);
    const effect=renderToStaticMarkup(<StyleBackdrop style={{id,seed:39,intensity:.6}} frame={50} fps={30} width={640} height={360}/>);
    expect(effect).toContain('data-visual-effect="'+id+'"');
    expect(effect).toContain('<svg');
    expect(effect).not.toMatch(/NaN|Infinity|undefined/);
    const content=renderToStaticMarkup(<StageContext.Provider value={{surface:'opaque',surfaceOpacity:.9,dualRail:false,visualStyle:id}}><CommandPalette
      content={{structure:'command-palette',commandTitle:'相同内容',actions:['读取','执行','验证'],resultState:'完成'}} progress={1} palette={p} placement="full"/></StageContext.Provider>);
    expect(content).toContain('相同内容');
    expect(content).toContain('读取');
    expect(content).toContain(m.fontFamily.replaceAll('"','&quot;'));
  });
  it('uses no independent animation clocks or external user assets in all effect modules',()=>{
    for(const file of ['index.tsx','extended-a.tsx','extended-b.tsx','catalog-backgrounds.tsx','catalog-animations.tsx','catalog-components.tsx']){
      const source=readFileSync(new URL('../src/styles/'+file,import.meta.url),'utf8');
      expect(source).not.toMatch(/Math\.random\s*\(|Date\.now\s*\(|performance\.now\s*\(|requestAnimationFrame\s*\(|setInterval\s*\(|setTimeout\s*\(|@keyframes|<image\s|<img\s|getUserMedia/);
    }
  });
});
