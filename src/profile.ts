import { bytes, forcedResult, MAX_PLIES, normalizeImportedGame, replayGame, results, validPublicId, type GameDraft, type ImportedGame } from './imported-games';
import type { Color } from 'chess.js';

export type PublicGame = { id: string; title: string; white: string; black: string; side: Color; result: GameDraft['result']; fen: string; moves: string };
export type ProfileDetails = { bio: string; avatar: 'n' | 'r' | 'q'; spotlight: string | null; stories: Record<string, string> };
export type PublicProfile = { version: 1; revision: number; name: string; games: PublicGame[]; details?: ProfileDetails };
export type ProfileSettings = { publicId: string; revision: number; featured: string[]; published: boolean };
export type ProfileOwnerState = { settings: ProfileSettings | null; profile: PublicProfile | null };
export function publicGameDraft(game: PublicGame): GameDraft { return { fen: game.fen, moves: game.moves.split(' '), white: game.white, black: game.black, date: '?', result: game.result }; }

function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function profileText(value: unknown, trim: boolean): string | null {
  if (typeof value !== 'string' || /[\p{Cc}\p{Cs}]/u.test(value)) return null;
  const text = value.trim();
  if ((!trim && text !== value) || [...text].length > 160) return null;
  return text;
}

function normalizeProfileDetails(value: unknown, included: ReadonlySet<string>, trim: boolean): ProfileDetails | null {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !== 'avatar,bio,spotlight,stories') return null;
  const { avatar, spotlight, stories } = value;
  if (avatar !== 'n' && avatar !== 'r' && avatar !== 'q') return null;
  if (spotlight !== null && (typeof spotlight !== 'string' || !included.has(spotlight))) return null;
  if (!isRecord(stories) || Object.keys(stories).length > 8) return null;
  const bio = profileText(value.bio, trim);
  if (bio === null) return null;
  const cleanStories: Record<string, string> = {};
  for (const [id, value] of Object.entries(stories)) {
    const story = profileText(value, trim);
    if (!included.has(id) || story === null) return null;
    cleanStories[id] = story;
  }
  return { bio, avatar, spotlight, stories: cleanStories };
}

export function projectProfile(name: string, games: ImportedGame[], revision: number, details?: ProfileDetails): PublicProfile {
  if (!name.trim() || name.trim().length > 40 || /[\u0000-\u001f]/.test(name)) throw new Error('Choose a public name with 1–40 characters.');
  if (games.length > 8 || !games.length) throw new Error('Select 1–8 favorite games to publish.');
  if (new Set(games.map(g => g.id)).size !== games.length) throw new Error('Select each game only once.');
  const profile: PublicProfile = { version: 1, revision, name: name.trim(), games: games.map(source => {
    const game = normalizeImportedGame(source);
    if (!game || game.deleted || !game.favorite) throw new Error('Only saved favorite games can be published.');
    return { id: game.publicId, title: game.title, white: game.white, black: game.black, side: game.side, result: game.result, fen: game.fen, moves: game.moves.join(' ') };
  }) };
  if (details !== undefined) {
    const cleanDetails = normalizeProfileDetails(details, new Set(profile.games.map(game => game.id)), true);
    if (!cleanDetails) throw new Error('Use a supported avatar and choose games from your selection for the spotlight and stories. Bio and stories must have 160 plain-text characters or fewer.');
    profile.details = cleanDetails;
  }
  if (!normalizePublicProfile(profile)) throw new Error('This profile is too large or contains an invalid game.');
  return profile;
}

export function normalizePublicProfile(value: unknown): PublicProfile | null {
  try {
    if (!value || typeof value !== 'object' || bytes(value) > 400 * 1024) return null;
    const p = value as PublicProfile;
    const hasDetails = Object.hasOwn(p, 'details');
    const keys = hasDetails ? 'details,games,name,revision,version' : 'games,name,revision,version';
    if (Object.keys(p).sort().join(',') !== keys || p.version !== 1 || !Number.isSafeInteger(p.revision) || p.revision < 1
      || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 40 || !Array.isArray(p.games) || p.games.length > 8) return null;
    const seen = new Set<string>();
    for (const g of p.games) {
      if (!g || Object.keys(g).sort().join(',') !== 'black,fen,id,moves,result,side,title,white' || typeof g.id !== 'string' || !validPublicId(g.id) || seen.has(g.id)
        || !['w', 'b'].includes(g.side) || !results.includes(g.result) || bytes(g) > 40 * 1024
        || ![g.title, g.white, g.black].every(s => typeof s === 'string' && s.length > 0 && s.length <= 80 && !/[\u0000-\u001f]/.test(s))
        || typeof g.fen !== 'string' || g.fen.length > 200 || typeof g.moves !== 'string' || !g.moves || g.moves.split(' ').length > MAX_PLIES) return null;
      const board = replayGame(publicGameDraft(g));
      if (forcedResult(board) && g.result !== forcedResult(board)) return null;
      seen.add(g.id);
    }
    const profile: PublicProfile = { version: 1, revision: p.revision, name: p.name, games: p.games.map(g => ({ ...g })) };
    if (hasDetails) {
      const details = normalizeProfileDetails(p.details, seen, false);
      if (!details) return null;
      profile.details = details;
    }
    return profile;
  } catch { return null; }
}
