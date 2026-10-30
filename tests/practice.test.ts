import { describe, expect, it } from 'vitest';
import { makeGame, lessons } from '../src/chess';
import { acceptsPracticeMove, practiceQueue, recordPractice, preserveGameDuringPractice } from '../src/practice';
import { emptyProgress, mergeProgress, normalizeProgress } from '../src/progress';
import type { Line } from '../src/engine';
const line=(score:number,mate?:number):Line=>({move:'e2e4',pv:['e2e4'],score,depth:12,...(mate === undefined ? {} : {mate})});
const lesson={id:'one',fen:lessons[0].fen,move:'a3',best:'e4',text:'Control the center.',date:'2026-10-30',count:1};
const after=makeGame();after.move('e4');
describe('personal practice',()=>{
 it('accepts sound alternatives but rejects a material loss',()=>{
  expect(acceptsPracticeMove(line(100),line(-50),after.fen())).toBe(true);
  expect(acceptsPracticeMove(line(100),line(100),after.fen())).toBe(false);
 });
 it('requires the forced mate to remain when one was available',()=>{
  expect(acceptsPracticeMove(line(99900,1),line(-99500,-5),after.fen())).toBe(true);
  expect(acceptsPracticeMove(line(99900,1),line(-900),after.fen())).toBe(false);
 });
 it('recognizes a checkmate and does not reward drawing a winning position',()=>{
  const mate=makeGame('6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1');mate.move('Re8#');
  expect(acceptsPracticeMove(line(99900,1),null,mate.fen())).toBe(true);
  const draw='7k/8/5KQ1/8/8/8/8/8 b - - 0 1';
  expect(makeGame(draw).isStalemate()).toBe(true);
  expect(acceptsPracticeMove(line(900),null,draw)).toBe(false);
  expect(acceptsPracticeMove(line(-200),null,draw)).toBe(true);
 });
 it('prioritizes unsolved recurring positions and avoids repeating the same board',()=>{
  const solved={...lesson,id:'solved',fen:lessons[1].fen,practice:recordPractice(undefined,true,true,100)};
  const frequent={...lesson,id:'frequent',count:4};
  const black={...lesson,id:'black',fen:after.fen()};
  expect(practiceQueue([solved,lesson,frequent,black]).map(x=>x.id)).toEqual(['frequent','solved']);
 });
 it('keeps assisted and independent solutions separate',()=>{
  let record=recordPractice(undefined,false,false,10);
  record=recordPractice(record,true,false,20);
  expect(record).toMatchObject({attempts:2,solved:1,independent:0,lastSolved:20});
  expect(recordPractice(record,true,true,30)).toMatchObject({attempts:3,solved:2,independent:1});
 });
 it('saves new evidence without replacing the original game, even on reload',()=>{
  const original={...emptyProgress(),moves:['e4','e5'],updatedAt:100};
  const practice={...emptyProgress(),lessonId:'saved',customFen:lessons[1].fen,moves:['Nxd5'],saved:[{...lesson,practice:recordPractice(undefined,true,true,200)}],updatedAt:200};
  const result=normalizeProgress(preserveGameDuringPractice(practice,original));
  expect(result).toMatchObject({lessonId:'free',moves:['e4','e5'],updatedAt:100});
  expect(result.customFen).toBeUndefined();
  expect(result.saved[0].practice?.independent).toBe(1);
 });
 it('preserves the newest practice evidence when guest progress merges again',()=>{
  const old={...emptyProgress(),saved:[lesson]};
  const record=recordPractice(undefined,true,true,200);
  const latest={...emptyProgress(),saved:[{...lesson,practice:record}]};
  expect(mergeProgress(old,latest).saved[0].practice).toEqual(record);
  expect(mergeProgress(latest,old).saved[0].practice).toEqual(record);
  expect(mergeProgress(mergeProgress(old,latest),latest)).toEqual(mergeProgress(old,latest));
 });
 it('bounds malformed practice evidence from stored progress',()=>{
  const result=normalizeProgress({...emptyProgress(),saved:[{...lesson,practice:{attempts:2,solved:99,independent:50,lastAttempt:-1,lastSolved:Infinity}}]});
  expect(result.saved[0].practice).toEqual({attempts:2,solved:2,independent:2,lastAttempt:0,lastSolved:0});
 });
});
