import {describe,it,expect} from 'vitest';
import {Chess} from 'chess.js';
import {chooseOpponentMove} from '../src/opponent';
import {playUci} from '../src/chess';
describe('practice opponents',()=>{
 it.each(['casual','club'] as const)('%s can win a real game with checkmate',level=>{
  const game=new Chess(); for(const san of ['f3','e5','g4'])game.move(san);
  playUci(game,chooseOpponentMove(game.fen(),level,()=>0)!);
  expect(game.isCheckmate()).toBe(true);
 });
 it.each(['casual','club'] as const)('%s plays a legal reply to check',level=>{
  const game=new Chess('4k3/8/8/8/8/8/4R3/4K3 b - - 0 1');
  expect(()=>playUci(game,chooseOpponentMove(game.fen(),level,()=>0.99)!)).not.toThrow();
  expect(game.isCheck()).toBe(false);
 });
 it('returns no move at the end of a game',()=>{
  expect(chooseOpponentMove('6k1/5ppp/8/8/8/8/5PPP/4R1K1 b - - 0 1','casual')).not.toBeNull();
  const game=new Chess();for(const san of ['f3','e5','g4','Qh4#'])game.move(san);
  expect(chooseOpponentMove(game.fen(),'club')).toBeNull();
 });
 it('lets casual play miss a recapture that club checks',()=>{
  // Black can grab a defended pawn with its queen. Club sees the rook reply.
  const fen='6k1/5ppp/8/8/3q4/8/3P1PPP/3R2K1 b - - 0 1';
  expect(chooseOpponentMove(fen,'casual',()=>0)).toBe('d4d2');
  expect(chooseOpponentMove(fen,'club',()=>0)).not.toBe('d4d2');
 });
 it('handles promotion without mutating the supplied position',()=>{
  const fen='7k/8/8/8/8/8/p7/7K b - - 0 1';
  const game=new Chess(fen);const move=chooseOpponentMove(fen,'casual',()=>0)!;
  expect(move).toBe('a2a1q');expect(game.fen()).toBe(fen);playUci(game,move);
  expect(game.get('a1')?.type).toBe('q');
 });
});
