import {createHash} from 'node:crypto';
import {renderStructure, fixtureContent} from './stage-fixtures';
console.log(JSON.stringify(Object.fromEntries(Object.keys(fixtureContent).map((key)=>[key,createHash('sha256').update(renderStructure(key as keyof typeof fixtureContent)).digest('hex')])),null,2));