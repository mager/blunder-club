import { Chess } from 'chess.js';
import { createImportedGame, forcedResult, MAX_PLIES, type GameDraft } from './imported-games';
import type { GameLibrary } from './library-store';
import { opponents, type OpponentLevel } from './opponent';

export function playedGameDraft(start: string, history: readonly string[], level: OpponentLevel): GameDraft {
  if (!history.length) throw new Error('Play at least one move before saving a game.');
  if (history.length > MAX_PLIES) throw new Error('This game is too long. The limit is 1,000 half-moves.');
  let game: Chess;
  try { game = new Chess(start); } catch { throw new Error('The starting position is invalid.'); }
  const fen = game.fen();
  const moves = history.map((san, index) => {
    try {
      if (game.isGameOver()) throw new Error();
      const move = game.move(san);
      return `${move.from}${move.to}${move.promotion || ''}`;
    } catch { throw new Error(`Move ${index + 1} (${san.slice(0, 24)}) is not legal in this game.`); }
  });
  const opponent = opponents.find(option => option.id === level);
  if (!opponent) throw new Error('The opponent is unknown.');
  return { fen, moves, white: 'You', black: `Nextmove (${opponent.name})`, date: '?',
    result: forcedResult(game) || (game.isDraw() ? '1/2-1/2' : '*') };
}

export async function savePlayedGame(library: GameLibrary, draft: GameDraft, favorite: boolean, current: () => boolean) {
  const game = await createImportedGame(draft, 'w');
  if (!current()) throw new Error('The account changed. Open Save game again.');
  const saved = await library.save({ ...game, favorite }, false, current);
  if (!current()) throw new Error('The account changed. Open Save game again.');
  return saved;
}
