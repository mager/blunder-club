import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createImportedGame, parseGamePgn } from '../src/imported-games';
import { gameFacts, playingStyle } from '../src/playing-style';

const example = readFileSync('tests/fixtures/pawn-mate.pgn', 'utf8');
describe('move evidence', () => {
  it('counts only the selected side and does not infer a style from one game', async () => {
    const g = await createImportedGame(parseGamePgn(example), 'w');
    expect(gameFacts(g)).toMatchObject({ moves: 36, checks: 10, captures: 9, first: 'd4', castle: { move: 9 } });
    expect(playingStyle([g, g])).toMatchObject({ sample: 1, suggestion: null });
    expect(gameFacts({ ...g, side: 'b' }).moves).toBe(35);
  });
  it('uses repeated e4/d4 choices and recomputes after side changes and deletion', async () => {
    for (const [move, lesson] of [['e4', 'italian'], ['d4', 'queens-gambit']]) {
      const games = await Promise.all(['One', 'Two', 'Three'].map(name => createImportedGame(parseGamePgn(`[Black "${name}"]\n1. ${move} *`), 'w')));
      expect(playingStyle(games).suggestion?.lesson).toBe(lesson);
      expect(playingStyle(games.map((g, i) => i ? g : { ...g, deleted: true })).suggestion).toBeNull();
      expect(playingStyle(games.map(g => ({ ...g, side: 'b' as const }))).suggestion).toBeNull();
    }
  });
  it('excludes short and custom games from the castling denominator', async () => {
    const games = await Promise.all(['A', 'B', 'C'].map(name => createImportedGame(parseGamePgn(`[Black "${name}"]\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 d6 5. Nc3 Nf6 6. Be3 Be6 7. Qd2 Qd7 8. a3 a6 9. b4 Bb6 10. h3 h6 *`), 'w')));
    expect(playingStyle(games).suggestion?.lesson).toBe('castle-short');
    expect(playingStyle(games.slice(0, 2)).suggestion).toBeNull();
    const custom = await createImportedGame(parseGamePgn('[SetUp "1"]\n[FEN "8/8/8/8/8/5k2/4p3/K7 b - - 0 29"]\n29... e1=Q+ *'), 'b');
    expect(gameFacts(custom)).toMatchObject({ standard: false, moves: 1, checks: 1 });
  });
  it('counts en passant as one capture', async () => {
    const g = await createImportedGame(parseGamePgn('1. e4 a6 2. e5 d5 3. exd6 *'), 'w');
    expect(gameFacts(g).captures).toBe(1);
  });
});
