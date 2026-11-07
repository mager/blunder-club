import {describe, expect, it} from 'vitest';
import {Chess} from 'chess.js';
import {hintMoves} from '../src/hints';
import type {Line} from '../src/engine';
import {findStudy} from '../src/curriculum';
import {playUci} from '../src/chess';
const fen=new Chess().fen();
const line=(move:string,score:number,mate?:number):Line=>({move,score,pv:[move],depth:12,...(mate===undefined?{}:{mate})});

describe('sound hint choices',()=>{
  it('offers close legal options without padding with weak or duplicate moves',()=>{
    expect(hintMoves(fen,[line('e2e4',40),line('d2d4',20),line('g1f3',-20),line('c2c4',-21)])).toEqual(['e2e4','d2d4','g1f3']);
    expect(hintMoves(fen,[line('e2e4',40),line('e2e4',40),line('e2e5',30),line('d2d4',-150)])).toEqual(['e2e4']);
  });
  it('keeps a forced winning mate even when another option wins material',()=>{
    expect(hintMoves(fen,[line('e2e4',99500,5),line('d2d4',99000,10),line('g1f3',900)])).toEqual(['e2e4','d2d4']);
  });
  it('does not suggest a new forced loss or a faster mate against the player',()=>{
    expect(hintMoves(fen,[line('e2e4',-100),line('d2d4',-99900,-1)])).toEqual(['e2e4']);
    expect(hintMoves(fen,[line('e2e4',-99400,-6),line('d2d4',-99800,-2),line('g1f3',-99400,-6)])).toEqual(['e2e4','g1f3']);
  });
  it('offers only accepted lesson moves, including a safe alternative',()=>{
    const lesson=findStudy('save-rook')!;
    expect(hintMoves(lesson.fen,[],lesson.steps[0])).toEqual(['a1a8','a1a2','a1a4']);
    const opening=findStudy('italian')!;
    expect(hintMoves(opening.fen,[line('d2d4',30)],opening.steps[0])).toEqual(['e2e4']);
  });
  it('finds multiple legal mates without suggesting stalemate',()=>{
    const lesson={fen:'7k/RR6/8/8/8/8/8/6K1 w - - 0 1',step:{...findStudy('ladder-mate')!.steps[0],move:'a7a8'}};
    const choices=hintMoves(lesson.fen,[],lesson.step);
    expect(choices.length).toBeGreaterThan(1);
    expect(choices.length).toBeLessThanOrEqual(3);
    for(const move of choices) {const board=new Chess(lesson.fen);playUci(board,move);expect(board.isCheckmate()).toBe(true);}
  });
  it('does not offer an immediate draw when a winning line exists',()=>{
    const position='7k/4Q3/5K2/8/8/8/8/8 w - - 0 1';
    expect(hintMoves(position,[line('e7g7',99900,1),line('e7f7',99000,10)])).toEqual(['e7g7']);
  });
});
