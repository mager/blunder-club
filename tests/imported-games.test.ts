import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createImportedGame, editImportedGame, gameIdentity, normalizeImportedGame, parseGamePgn, replayGame } from '../src/imported-games';

const example = readFileSync('tests/fixtures/pawn-mate.pgn', 'utf8');
describe('imported games', () => {
  it('imports the annotated game and checks its finish', async () => {
    const draft = parseGamePgn(example);
    expect(draft.moves).toHaveLength(71);
    expect(replayGame(draft).isCheckmate()).toBe(true);
    const record = await createImportedGame(draft, 'w');
    expect(normalizeImportedGame(record)).toEqual(record);
    expect(record.side).toBe('w');
    expect(replayGame(record, 0).history()).toEqual([]);
    expect(() => replayGame(record, 72)).toThrow('not in this game');
  });
  it('ignores comments, NAGs, annotations and nested variations in identity', async () => {
    const a = parseGamePgn('1. e4! $1 {hello} (1. d4 d5 (1... Nf6)) e5 ; hello\n2. Nf3 *');
    const b = parseGamePgn('1.e4 e5 2.Nf3 *');
    expect(await gameIdentity(a)).toBe(await gameIdentity(b));
    expect(a.moves).toEqual(['e2e4', 'e7e5', 'g1f3']);
  });
  it('keeps opponents distinct and side/title out of identity', async () => {
    const draft = parseGamePgn('[Black "One"]\n\n1. d4 *');
    expect(await gameIdentity(draft)).not.toBe(await gameIdentity({ ...draft, black: 'Two' }));
    const record = await createImportedGame(draft, 'b');
    const edited = editImportedGame(record, { side: 'w', title: 'My favorite', favorite: true, deleted: true });
    expect(edited.id).toBe(record.id);
    expect(editImportedGame(edited, { deleted: false }).favorite).toBe(true);
  });
  it('supports custom Black starts and promotions', () => {
    const draft = parseGamePgn('[SetUp "1"]\n[FEN "8/8/8/8/8/5k2/4p3/K7 b - - 0 29"]\n\n29... e1=Q+ *');
    expect(draft.moves).toEqual(['e2e1q']);
    expect(replayGame(draft).history()).toEqual(['e1=Q+']);
  });
  it.each([
    ['', 'at least one move'], ['1. e5 *', 'not legal'],
    ['1. e4 * 1. d4 *', 'one game'], ['1. e4 *\n[White "Two"]\n1. d4 *', 'one game'],
    ['[Variant "Chess960"]\n1. e4 *', 'standard'], ['[SetUp "1"]\n1. e4 *', 'custom start'],
    ['[FEN "bad"]\n1. e4 *', 'custom start'], ['[SetUp "1"]\n[FEN "bad"]\n1. e4 *', 'FEN'],
    ['[Result "1-0"]\n1. e4 0-1', 'do not match'], ['1. e4 {oops', 'comment'],
    ['1. e4 (1. d4', 'variation'], ['x'.repeat(131073), 'too large'],
    ['1. f3 e5 2. g4 Qh4# 1-0', 'final board'],
  ])('rejects malformed input: %s', (input, error) => { expect(() => parseGamePgn(input)).toThrow(error); });
  it('does not require a mate for a resignation result', () => { expect(parseGamePgn('1. e4 1-0').result).toBe('1-0'); });
  it('does not treat an unclaimed repetition as a forced result', () => { expect(parseGamePgn('1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8 1-0').result).toBe('1-0'); });
  it('rejects oversized histories and damaged saved moves', async () => {
    expect(() => parseGamePgn(Array(251).fill('Nf3 Nf6 Ng1 Ng8').join(' '))).toThrow('1,000 half-moves');
    const record = await createImportedGame(parseGamePgn('1. e4 *'), 'w');
    expect(normalizeImportedGame({ ...record, moves: ['e2e5'] })).toBeNull();
    expect(normalizeImportedGame({ ...record, moves: Array(1001).fill('e2e4') })).toBeNull();
    expect(normalizeImportedGame({ ...record, secret: 'ignored' })).not.toHaveProperty('secret');
  });
});
