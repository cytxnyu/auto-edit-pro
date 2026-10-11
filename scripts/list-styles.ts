import {resolve} from 'node:path';
import {CATALOG_STYLE_IDS} from '../packages/core/src/catalog-styles';
import {loadStyleCatalog} from './style-catalog-lib';
const args=process.argv.slice(2);
let category:string|undefined;let onlyNew=false;let format:'table'|'json'|'pool'='table';
while(args.length){
 const arg=args.shift();
 if(arg==='--category'){category=args.shift();if(!['backgrounds','animations','components'].includes(category??''))throw new Error('Category must be backgrounds, animations or components');}
 else if(arg==='--new')onlyNew=true;
 else if(arg==='--json')format='json';
 else if(arg==='--pool')format='pool';
 else throw new Error('Usage: npm run list:styles -- [--category backgrounds|animations|components] [--new] [--json|--pool]');
}
const entries=loadStyleCatalog(resolve(import.meta.dirname,'..')).filter(e=>(!category||e.category===category)&&(!onlyNew||(CATALOG_STYLE_IDS as readonly string[]).includes(e.id)));
if(format==='json')console.log(JSON.stringify(entries,null,2));
else if(format==='pool')console.log(entries.map(e=>e.id).join(','));
else{console.log(`styles=${entries.length}; local frame-driven video interpretations`);for(const e of entries)console.log(`${e.category}\t${e.id}\t${e.url}`);}
