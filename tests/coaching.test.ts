import {describe,it,expect} from 'vitest';
import {Chess} from 'chess.js';
import {rehearsal,needsWarning,assessedLoss,type TurningPoint} from '../src/coaching';
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
 it('warns for a meaningful loss, not every missed engine improvement',()=>{
  const ordinary={...point,best:{...point.best,score:200},reply:{move:'e5e4',pv:['e5e4'],score:0,depth:12},loss:200};
  expect(needsWarning(ordinary,'free','warn')).toBe(true);
  expect(needsWarning({...ordinary,loss:179},'free','warn')).toBe(false);
  expect(needsWarning(ordinary,'free','after')).toBe(false);
  expect(needsWarning(ordinary,'free','live')).toBe(false);
  expect(needsWarning(ordinary,'italian','warn')).toBe(false);
 });
 it('does not stop Nf3 in the supplied strong position',()=>{
  const screenshot=new Chess('rnbqkb1r/1ppp2pp/8/p3pP2/3P4/8/PPP3PP/RNBQKBNR w KQkq - 0 7');
  const move=screenshot.move('Nf3');
  const best={move:'d1h5',pv:['d1h5'],score:932,depth:12};
  const choice={move:'g1f3',pv:['g1f3','e5e4'],score:634,depth:12};
  const reply={move:'e5e4',pv:['e5e4'],score:-601,depth:12};
  const loss=assessedLoss(best,reply,'g1f3',[best,choice]);
  expect(loss).toBe(298);
  expect(needsWarning({before:[],fen:move.before,move,best,reply,loss},'free','warn')).toBe(false);
 });
 it('never warns against its own recommended move when the next search changes score',()=>{
  expect(assessedLoss(point.best,{...point.reply,score:500},'e2e4')).toBe(0);
 });
 it('keeps new mate warnings but does not blame an already forced loss',()=>{
  expect(needsWarning(point,'free','warn')).toBe(true);
  expect(needsWarning({...point,best:{...point.best,mate:-5,score:-99500}},'free','warn')).toBe(false);
 });
});
