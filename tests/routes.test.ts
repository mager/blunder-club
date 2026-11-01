import {describe,it,expect} from 'vitest';
import {readRoute,routeHash,panels} from '../src/routes';
import {lessons} from '../src/chess';
describe('revisitable game URLs',()=>{
 it('round-trips a full game, hint and panel without account data',()=>{
  const route={lessonId:'free',moves:['e4','e5','Nf3','Nc6'],panel:'moves' as const,hint:true};
  const hash=routeHash(route);
  expect(readRoute(hash)).toMatchObject(route);
  expect(hash).not.toMatch(/uid|token|accountId/);
 });
 it('links directly to every built-in lesson and view',()=>{
  for(const lessonId of ['italian',...lessons.map(l=>l.id)]) {
   for(const panel of panels) expect(readRoute(routeHash({lessonId,moves:[],panel}))).toMatchObject({lessonId,panel});
  }
 });
 it('reopens a personal practice position without exposing the original game',()=>{
  const hash=routeHash({lessonId:'saved',fen:lessons[1].fen,moves:[],position:true});
  expect(readRoute(hash)).toMatchObject({lessonId:'saved',fen:lessons[1].fen,position:true,moves:[]});
 });
 it('preserves a custom full-game position and promotion notation',()=>{
  const route={lessonId:'saved',fen:'7k/P7/8/8/8/8/8/6K1 w - - 0 1',moves:['a8=Q+']};
  expect(readRoute(routeHash(route))).toMatchObject({...route,position:false});
 });
 it('keeps replay and pending warning separate from played moves',()=>{
  expect(readRoute(routeHash({lessonId:'free',moves:['f3','e5'],candidate:'g4',stage:2}))).toMatchObject({moves:['f3','e5'],candidate:'g4',stage:2});
  expect(readRoute(routeHash({lessonId:'free',moves:['f3','e5','g4','Qh4#'],review:2,stage:0}))).toMatchObject({review:2,stage:0});
 });
 it('rejects damaged or illegal links before replacing saved progress',()=>{
  for(const hash of ['#/unknown','#/position','#/play?panel=journey&skill=bad','#/position?fen=bad','#/play?moves=Qh8','#/play?panel=bad','#/play?review=0','#/play?candidate=Qh8','#/position?fen='+encodeURIComponent(lessons[0].fen)+'&moves=e4']) expect(()=>readRoute(hash)).toThrow();
  expect(readRoute('')).toBeNull();expect(readRoute('#play')).toBeNull();
 });
 it('restores the selected journey place while keeping the current board',()=>{
  const route={lessonId:'free',moves:['e4','e5'],panel:'journey' as const,skill:'tactics'};
  expect(readRoute(routeHash(route))).toMatchObject(route);
 });
 it('keeps the exact alternate hint and rejects illegal hint moves',()=>{
  const route={lessonId:'free',moves:[],hint:true,hintMove:'g1f3'};
  expect(readRoute(routeHash(route))).toMatchObject(route);
  expect(()=>readRoute('#/play?hint=1&hintMove=g1g8')).toThrow();
  expect(()=>readRoute('#/play?hint=1&hintMove=oops')).toThrow();
 });
 it('keeps opening recall and optional explanations',()=>{
  const route={lessonId:'italian',moves:['e4','e5'],recall:true,panel:'explanation' as const,explanation:'Control the center & develop.'};
  expect(readRoute(routeHash(route))).toMatchObject(route);
 });
});

it('keeps an old practice link playable after the authored lesson ends',()=>{
 const route=readRoute('#/practice/hanging?moves=Nxd5,Kf8');
 expect(route).toMatchObject({lessonId:'saved',position:false,moves:['Nxd5','Kf8']});
 expect(readRoute(routeHash(route!))).toMatchObject({lessonId:'saved',position:false,moves:['Nxd5','Kf8']});
});
