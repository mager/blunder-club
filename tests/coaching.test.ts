import {describe,it,expect} from 'vitest';
import {Chess} from 'chess.js';
import {rehearsal,needsWarning,type TurningPoint} from '../src/coaching';
describe('move rehearsal',()=>{
 const game=new Chess();game.move('f3');game.move('e5');
 const fen=game.fen();const before=game.history();const move=game.move('g4');
 const point:TurningPoint={before,fen,move,best:{move:'e2e4',pv:['e2e4'],score:0,depth:12},reply:{move:'d8h4',pv:['d8h4'],score:99999,mate:1,depth:12},loss:99999};
 it('can move between before, move, and reply without changing game history',()=>{
  const original=game.fen();
  expect(rehearsal(point,2).isCheckmate()).toBe(true);
  expect(rehearsal(point,0).fen()).toBe(fen);
  expect(rehearsal(point,1).get('g4')?.type).toBe('p');
  expect(game.fen()).toBe(original);expect(before).toEqual(['f3','e5']);
 });
 it('warns only for costly moves in the selected mode',()=>{
  expect(needsWarning(120,'free','warn')).toBe(true);
  expect(needsWarning(119,'free','warn')).toBe(false);
  expect(needsWarning(500,'free','after')).toBe(false);
  expect(needsWarning(500,'free','live')).toBe(false);
  expect(needsWarning(500,'italian','warn')).toBe(false);
 });
});
