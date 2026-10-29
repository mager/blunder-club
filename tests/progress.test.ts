import {describe,expect,it} from 'vitest';
import {emptyProgress,mergeProgress,normalizeProgress,stampBoardProgress} from '../src/progress';
import {lessons} from '../src/chess';
const lesson={id:'position-1',fen:lessons[0].fen,move:'e4',best:'d4',text:'Look at the center.',date:'2026-10-29',count:2};
describe('progress migration',()=>{
 it('keeps a legal saved game and its practice evidence',()=>{
   const result=normalizeProgress({...emptyProgress(),moves:['e4','e5'],saved:[lesson],practiced:['center','unknown']});
   expect(result.moves).toEqual(['e4','e5']);expect(result.saved).toHaveLength(1);expect(result.practiced).toEqual(['center']);
 });
 it('rejects an illegal board history without deleting valid lessons',()=>{
   const result=normalizeProgress({...emptyProgress(),moves:['Qh8'],saved:[lesson]});
   expect(result.moves).toEqual([]);expect(result.saved).toHaveLength(1);
 });
 it('restores a custom practice position',()=>{
   const result=normalizeProgress({...emptyProgress(),lessonId:'saved',customFen:lessons[1].fen,moves:['Nxd5']});
   expect(result.customFen).toBe(lessons[1].fen);expect(result.moves).toEqual(['Nxd5']);
 });
 it('imports guest lessons without counting the same encounter twice',()=>{
   const account={...emptyProgress(),saved:[lesson],played:5,practiced:['center'],updatedAt:20};
   const guest={...emptyProgress(),saved:[{...lesson,count:3}],played:3,practiced:['king'],updatedAt:10};
   const result=mergeProgress(account,guest);
   expect(result.saved).toHaveLength(1);expect(result.saved[0].count).toBe(3);expect(result.played).toBe(5);expect(result.practiced).toEqual(['center','king']);
   expect(mergeProgress(result,guest)).toEqual(result);
 });
 it('keeps the newer board when two device copies are combined',()=>{
   const older={...emptyProgress(),moves:['d4'],updatedAt:5};
   const newer={...emptyProgress(),moves:['e4','e5'],updatedAt:10};
   expect(mergeProgress(older,newer).moves).toEqual(newer.moves);
 });
 it('imports an older guest save that has no timestamp',()=>{
   const guest=normalizeProgress({...emptyProgress(),moves:['e4']});
   expect(mergeProgress(emptyProgress(),guest).moves).toEqual(['e4']);
 });
 it('removes malformed positions and invalid counters',()=>{
   expect(normalizeProgress({saved:[{...lesson,fen:'invalid'}],played:-2,retries:Infinity})).toMatchObject({saved:[],played:0,retries:0});
 });
});


describe('progress conflict recovery',()=>{
 it('does not refresh the board timestamp for analysis or settings changes',()=>{
  const old={...emptyProgress(),moves:['d4'],updatedAt:5};
  const analyzed=stampBoardProgress({...old,sound:true,saved:[lesson]},old,100);
  expect(analyzed.updatedAt).toBe(5);
  expect(mergeProgress({...emptyProgress(),moves:['e4'],updatedAt:10},analyzed).moves).toEqual(['e4']);
 });
 it('does not let an empty offline fallback replace an existing cloud game',()=>{
  const fallback=stampBoardProgress(emptyProgress(),emptyProgress(),100);
  expect(mergeProgress({...emptyProgress(),moves:['e4'],updatedAt:10},fallback).moves).toEqual(['e4']);
 });
 it('dates a deliberate board change',()=>{
  expect(stampBoardProgress({...emptyProgress(),moves:['e4']},emptyProgress(),100).updatedAt).toBe(100);
 });
 it('keeps a removed lesson deleted when an older device reconnects',()=>{
  const old={...emptyProgress(),saved:[lesson]};
  const deletion={...emptyProgress(),removedLessons:{[lesson.id]:Date.parse('2026-10-30')}};
  expect(mergeProgress(deletion,old).saved).toEqual([]);
  expect(mergeProgress(old,deletion).saved).toEqual([]);
 });
 it('allows a fresh encounter after a lesson was removed',()=>{
  const deletion={...emptyProgress(),removedLessons:{[lesson.id]:Date.parse('2026-10-30')}};
  expect(mergeProgress(deletion,{...emptyProgress(),saved:[{...lesson,date:'2026-10-31'}]}).saved).toHaveLength(1);
 });
});
