import { bytes, forcedResult, MAX_PLIES, normalizeImportedGame, replayGame, results, validPublicId, type GameDraft, type ImportedGame } from './imported-games';
import type { Color } from 'chess.js';

export type PublicGame = { id: string; title: string; white: string; black: string; side: Color; result: GameDraft['result']; fen: string; moves: string };
export type PublicProfile = { version: 1; revision: number; name: string; games: PublicGame[] };
export type ProfileSettings = { publicId: string; revision: number; featured: string[]; published: boolean };
export type ProfileOwnerState = { settings: ProfileSettings | null; profile: PublicProfile | null };
export function publicGameDraft(game: PublicGame): GameDraft { return { fen: game.fen, moves: game.moves.split(' '), white: game.white, black: game.black, date: '?', result: game.result }; }

export function projectProfile(name: string, games: ImportedGame[], revision: number): PublicProfile {
  if (!name.trim() || name.trim().length > 40 || /[\u0000-\u001f]/.test(name)) throw new Error('Choose a public name with 1–40 characters.');
  if (games.length > 8 || !games.length) throw new Error('Select 1–8 favorite games to publish.');
  if (new Set(games.map(g => g.id)).size !== games.length) throw new Error('Select each game only once.');
  const profile: PublicProfile = { version: 1, revision, name: name.trim(), games: games.map(source => {
    const game = normalizeImportedGame(source);
    if (!game || game.deleted || !game.favorite) throw new Error('Only saved favorite games can be published.');
    return { id: game.publicId, title: game.title, white: game.white, black: game.black, side: game.side, result: game.result, fen: game.fen, moves: game.moves.join(' ') };
  }) };
  if (!normalizePublicProfile(profile)) throw new Error('This profile is too large or contains an invalid game.');
  return profile;
}

export function normalizePublicProfile(value: unknown): PublicProfile | null {
  try {
    if (!value || typeof value !== 'object' || bytes(value) > 400 * 1024) return null;
    const p = value as PublicProfile;
    if (Object.keys(p).sort().join(',') !== 'games,name,revision,version' || p.version !== 1 || !Number.isSafeInteger(p.revision) || p.revision < 1
      || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 40 || !Array.isArray(p.games) || p.games.length > 8) return null;
    const seen = new Set<string>();
    for (const g of p.games) {
      if (!g || Object.keys(g).sort().join(',') !== 'black,fen,id,moves,result,side,title,white' || !validPublicId(g.id) || seen.has(g.id)
        || !['w', 'b'].includes(g.side) || !results.includes(g.result) || bytes(g) > 40 * 1024
        || ![g.title, g.white, g.black].every(s => typeof s === 'string' && s.length > 0 && s.length <= 80 && !/[\u0000-\u001f]/.test(s))
        || typeof g.fen !== 'string' || g.fen.length > 200 || typeof g.moves !== 'string' || !g.moves || g.moves.split(' ').length > MAX_PLIES) return null;
      const board = replayGame(publicGameDraft(g));
      if (forcedResult(board) && g.result !== forcedResult(board)) return null;
      seen.add(g.id);
    }
    return { version: 1, revision: p.revision, name: p.name, games: p.games.map(g => ({ ...g })) };
  } catch { return null; }
}
