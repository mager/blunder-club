import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { lessons, makeGame, playUci, lineToSan, mistakeLoss, resultText } from '../src/chess';
import { italian, openingSteps } from '../src/learning';
import { parseInfo } from '../src/engine';
import { classifyMistake } from '../src/rules';

const line = (move: string, score: number, mate?: number) => ({ move, score, pv: [move], depth: 12, ...(mate === undefined ? {} : { mate }) });
describe('Chess teaching evidence', () => {
  it('uses side-to-move scores correctly for a blunder and a good move', () => {
    expect(mistakeLoss(line('e2e4', 30), line('e7e5', -25))).toBe(5);
    expect(mistakeLoss(line('e2e4', 30), line('d8h4', 450))).toBe(480);
    expect(mistakeLoss(line('e2e4', 30), line('e7e5', -40))).toBe(0);
  });
  it('parses UCI scores and forced mate without confusing point of view', () => {
    expect(parseInfo('info depth 12 multipv 2 score cp -93 pv e2e4 e7e5')?.line.score).toBe(-93);
    expect(parseInfo('info depth 12 score mate 1 pv d8h4')?.line.mate).toBe(1);
    expect(parseInfo('info depth 12 score mate -2 pv e1f1')?.line.score).toBeLessThan(-90000);
    expect(parseInfo('info depth 12 score cp 30 upperbound pv e2e4')).toBeNull();
  });
  it('replays every authored Italian move legally and ends with both kings castled', () => {
    const game = new Chess(italian.fen);
    for (const step of openingSteps) { playUci(game, step.move); playUci(game, step.reply); }
    expect(game.get('g1')?.type).toBe('k'); expect(game.get('g8')?.type).toBe('k');
    expect(game.get('c3')?.type).toBe('n'); expect(game.turn()).toBe('w');
    expect(game.history()).toHaveLength(12);
  });
  it('keeps repetition history through a takeback/rebuild', () => {
    const moves = ['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1','Ng8'];
    expect(makeGame(italian.fen,moves).isThreefoldRepetition()).toBe(true);
    expect(makeGame(italian.fen,moves.slice(0,-2)).isThreefoldRepetition()).toBe(false);
  });
  it('supports en passant and all promotion choices', () => {
    const game = makeGame(italian.fen,['e4','a6','e5','d5']);
    expect(game.move('exd6').isEnPassant()).toBe(true);
    for (const promotion of ['q','r','b','n']) {
      const g = new Chess('7k/P7/8/8/8/8/8/6K1 w - - 0 1');
      expect(playUci(g,`a7a8${promotion}`).promotion).toBe(promotion);
    }
  });
  it('validates practice positions and their teaching targets', () => {
    for (const lesson of lessons) expect(new Chess(lesson.fen).turn()).toBe('w');
    const mate = new Chess(lessons.find(l=>l.id==='mate')!.fen); mate.move('Re8#'); expect(mate.isCheckmate()).toBe(true);
    const fork = new Chess(lessons.find(l=>l.id==='fork')!.fen); fork.move('Nf7+'); expect(fork.isCheck()).toBe(true); expect(fork.isAttacked('d8','w')).toBe(true);
    const queen = new Chess(lessons.find(l=>l.id==='hanging')!.fen); expect(queen.move('Nxd5').captured).toBe('q');
  });
  it('prioritizes forced mate over other teaching patterns', () => {
    const game = makeGame(italian.fen,['f3','e5']); const move = game.move('g4');
    expect(classifyMistake(move,line('d8h4',99900,1)).skill).toBe('king');
    expect(lineToSan(move.after,['d8h4'])).toEqual(['Qh4#']);
    game.move('Qh4#'); expect(resultText(game)).toContain('Checkmate');
  });
  it('labels an immediate capture as evidence, not an invented tactical proof', () => {
    const game = new Chess(lessons.find(l=>l.id==='hanging')!.fen); const move = game.move('g3');
    const result = classifyMistake(move,line('d5e4',400));
    expect(result.skill).toBe('threats');
  });
});
