import {describe,it,expect} from 'vitest';
import {journeyProgress} from '../src/journey';
import {emptyProgress,type SavedLesson} from '../src/progress';
import {lessons} from '../src/chess';
const position:SavedLesson={id:'one',fen:lessons[1].fen,move:'a3',best:'Nf3',text:'Practice',date:'2026-10-31',skill:'safety',count:12};
describe('journey evidence',()=>{
 it('starts with six open places and no invented achievements',()=>{
  const data=emptyProgress();const result=journeyProgress(data.saved,data.practiced);
  expect(result).toHaveLength(6);expect(result.every(s=>!s.explored && !s.solved)).toBe(true);
 });
 it('does not turn repeated mistakes into progress',()=>{
  const result=journeyProgress([position],[]).find(s=>s.id==='safety')!;
  expect(result).toMatchObject({revisit:1,tried:0,solved:0,independent:0,explored:false});
 });
 it('separates assisted solutions and counts each saved position once',()=>{
  const record={attempts:5,solved:3,independent:0,lastAttempt:1,lastSolved:1};
  const result=journeyProgress([{...position,practice:record},{...position,id:'two',practice:{...record,independent:1}}],['center']);
  expect(result.find(s=>s.id==='safety')).toMatchObject({tried:2,solved:2,independent:1,revisit:0,explored:true});
  expect(result.find(s=>s.id==='center')).toMatchObject({explored:true,solved:0});
 });
});
