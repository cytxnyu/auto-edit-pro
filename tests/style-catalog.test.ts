import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {loadStyleCatalog} from '../scripts/style-catalog-lib';
import {CATALOG_STYLE_IDS,CATALOG_BACKGROUNDS_IDS,CATALOG_ANIMATIONS_IDS,CATALOG_COMPONENTS_IDS} from '../packages/core/src/catalog-styles';
import {VISUAL_STYLE_IDS,seededStyleAssignments} from '../packages/core/src/visual-styles';
import {planStoryboard} from '../packages/core/src/planner';
const root=resolve(import.meta.dirname,'..');
describe('50-item executable catalog expansion',()=>{
 it('adds 50 unique IDs to the previous 21 across three reference types',()=>{
  expect(CATALOG_STYLE_IDS).toHaveLength(50);
  expect(CATALOG_BACKGROUNDS_IDS).toHaveLength(20);
  expect(CATALOG_ANIMATIONS_IDS).toHaveLength(15);
  expect(CATALOG_COMPONENTS_IDS).toHaveLength(15);
  expect(VISUAL_STYLE_IDS.slice(21)).toEqual(CATALOG_STYLE_IDS);
  expect(new Set(VISUAL_STYLE_IDS).size).toBe(71);
  expect(VISUAL_STYLE_IDS.slice(0,21).every(id=>!(CATALOG_STYLE_IDS as readonly string[]).includes(id))).toBe(true);
 });
 it('has verified official URLs, mechanisms and honest adaptation descriptions for every new effect',()=>{
  const entries=loadStyleCatalog(root);expect(entries.map(e=>e.id)).toEqual(VISUAL_STYLE_IDS);
  for(const e of entries.slice(21)){
   expect(e.verified).toBe(true);
   expect(e.url).toBe(`https://reactbits.dev/${e.category}/${e.id}`);
   expect(e.sourceUrl).toMatch(/^https:\/\/(?:github\.com|raw\.githubusercontent\.com)\/DavidHDev\/react-bits\//);
   expect(e.mechanism.length).toBeGreaterThan(20);expect(e.adaptation.length).toBeGreaterThan(20);
  }
 });
 it('keeps a saved 21-style bag unchanged after canonical expansion',()=>{
  const pool=VISUAL_STYLE_IDS.slice(0,21);
  const baseline=["micro-slats", "crt-warp", "waves", "grid-motion", "circular-carousel", "cubes", "light-tunnel", "lightning", "ghost-fibers", "metallic-paint", "electric-border", "balatro", "grid-scan", "light-pillar", "acid-squares", "floating-lines", "evil-eye", "prismatic-burst", "ripple-distortion", "hyperspeed", "shape-waves"];
  // The checked fixture sequence is populated directly from the 0.4.0 implementation.
  expect(seededStyleAssignments(21,{mode:'seeded-shuffle',seed:29,pool})).toEqual(baseline);
 });
 it('makes one full 71-item bag without changing semantics and rejects recycling',()=>{
  const input={id:'catalog-71-check',title:'Fixture',probe:{duration:284,size:0,video:{codec:'h264',width:1280,height:720,fps:30},audio:null},cues:Array.from({length:142},(_,i)=>({index:i+1,start:i*2,end:i*2+2,text:'读取素材，然后确认'})),captionsMode:'none' as const,sourceVideo:'unused.mp4',styleSeed:29};
  expect(()=>planStoryboard(input)).toThrow(/Single-use style pool exhausted/);
  const oneBag={...input,cues:input.cues.slice(0,71)};
  const board=planStoryboard(oneBag);expect(board.beats).toHaveLength(71);expect(board.styleMix!.pool).toEqual(VISUAL_STYLE_IDS);
  expect(board).toEqual(planStoryboard(oneBag));
  expect(new Set(board.beats.map(b=>b.visualStyle!.id))).toEqual(new Set(VISUAL_STYLE_IDS));
  const legacy=planStoryboard({...oneBag,styleSeed:undefined,styleMix:'legacy'});
  const meaning=(beats:typeof board.beats)=>beats.map(({visualStyle,palette,...b})=>b);
  expect(meaning(board.beats)).toEqual(meaning(legacy.beats));
 });
 it('exports a reusable components-only pool through the real CLI',()=>{
  const result=spawnSync(process.execPath,[resolve(root,'node_modules/tsx/dist/cli.mjs'),resolve(root,'scripts/list-styles.ts'),'--category','components','--new','--pool'],{cwd:root,encoding:'utf8',windowsHide:true});
  expect(result.status,result.stderr).toBe(0);expect(result.stdout.trim().split(',')).toEqual(CATALOG_COMPONENTS_IDS);
 });
});
