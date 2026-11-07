import { describe, expect, it } from 'vitest';
import { Chess, DEFAULT_POSITION } from 'chess.js';
import { identifyOpening, loadOpeningIndex } from '../src/opening-name';

const index = await loadOpeningIndex();
function name(pgn: string) { const game = new Chess(); game.loadPgn(pgn); return identifyOpening(game, index); }

describe('opening learning context', () => {
  it('names common opening families and the supplied unusual game', () => {
    expect(name('1. e4 e5 2. Nf3 Nc6 3. Bc4')).toBe('Italian Game');
    expect(name('1. e4 c5')).toBe('Sicilian Defense');
    expect(name('1. d4 d5 2. c4')).toBe("Queen's Gambit");
    expect(name('1. d4 a5 2. e4 Nc6')).toBe('Ware Defense');
  });
  it('recognizes transpositions by position', () => {
    expect(name('1. Nf3 d5 2. d4 Nf6 3. c4 e6 4. Nc3')).toBe(name('1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. Nc3'));
    expect(name('1. Nf3 d5 2. d4 Nf6 3. c4 e6 4. Nc3')).toBe("Queen's Gambit Declined");
  });
  it('keeps the last name after leaving theory and changes it after undo', () => {
    const game = new Chess(); game.loadPgn('1. e4 c5 2. a3 h5');
    expect(identifyOpening(game, index)).toBe('Sicilian Defense');
    while (game.history().length > 1) game.undo();
    expect(identifyOpening(game, index)).toBe("King's Pawn Game");
    game.undo(); expect(identifyOpening(game, index)).toBe('Play the first move');
  });
  it('does not invent an opening for arbitrary FEN starts', () => {
    expect(identifyOpening(new Chess('8/8/8/8/8/3k4/8/3K4 w - - 0 1'), index)).toBe('Not identified');
    const game = new Chess(); game.loadPgn('1. e4 c5');
    expect(identifyOpening(new Chess(game.fen()), index)).toBe('Sicilian Defense');
  });
  it('ignores move counters but preserves castling rights', () => {
    const game = new Chess(); game.loadPgn('1. e4 e5 2. Nf3 Nc6 3. Bc4');
    expect(identifyOpening(new Chess(game.fen().replace(/\d+ \d+$/, '8 12')), index)).toBe('Italian Game');
    expect(identifyOpening(new Chess(game.fen().replace('KQkq', '-')), index)).toBe('Not identified');
    expect(identifyOpening(new Chess(DEFAULT_POSITION), index)).toBe('Play the first move');
  });
});
