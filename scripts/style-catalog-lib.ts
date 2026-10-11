import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {CATALOG_STYLE_IDS} from '../packages/core/src/catalog-styles';
import {VISUAL_STYLE_IDS} from '../packages/core/src/visual-styles';

export type CatalogEntry = {id:string;name:string;category:'backgrounds'|'animations'|'components';url:string;sourceUrl:string;mechanism:string;adaptation:string;verified:boolean};
export const loadStyleCatalog=(root:string):CatalogEntry[]=>{
  const read=(file:string)=>readFileSync(resolve(root,file),'utf8');
  const previous=[...read('references/visual-style-mixing.md').matchAll(/^\| `([^`]+)` \/ \[([^\]]+)\]\((https:\/\/reactbits\.dev\/(backgrounds|animations|components)\/[^)]+)\) \| ([^|]+) \| ([^|]+) \|$/gm)].map(m=>({id:m[1],name:m[2],url:m[3],category:m[4] as CatalogEntry['category'],sourceUrl:'',mechanism:m[5].trim(),adaptation:m[6].trim(),verified:true}));
  const additions=(['backgrounds','animations','components'] as const).flatMap(category=>JSON.parse(read(`references/catalog-${category}.json`)) as CatalogEntry[]);
  const byId=new Map([...previous,...additions].map(e=>[e.id,e]));
  if(previous.length!==21||additions.length!==50||byId.size!==VISUAL_STYLE_IDS.length) throw new Error('Catalog does not match executable registry');
  if(CATALOG_STYLE_IDS.some(id=>!additions.some(e=>e.id===id)))throw new Error('New catalog ID missing');
  return VISUAL_STYLE_IDS.map(id=>byId.get(id)!);
};
