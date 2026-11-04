import { Chess, DEFAULT_POSITION, type Color } from 'chess.js';

export const MAX_PGN_BYTES = 128 * 1024;
export const MAX_PLIES = 1000;
export const MAX_GAMES = 100;
export const MAX_RECORD_BYTES = 40 * 1024;
export const results = ['1-0', '0-1', '1/2-1/2', '*'] as const;
export type GameResult = typeof results[number];
export type GameDraft = {
  fen: string; moves: string[]; white: string; black: string; date: string; result: GameResult;
};
export type ImportedGame = GameDraft & {
  version: 1; id: string; publicId: string; side: Color; title: string; favorite: boolean;
  deleted: boolean; revision: number; editedAt: number;
};
export const bytes = (value: unknown) => new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value)).length;
export const publicId = () => crypto.randomUUID().replaceAll('-', '');
export const validPublicId = (id: string) => /^[a-f0-9]{32}$/.test(id);
export const validGameId = (id: string) => /^[a-f0-9]{64}$/.test(id);
const uci = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

function label(value: unknown, fallback: string, limit = 80): string {
  const text = typeof value === 'string' ? value.trim() : fallback;
  if (text.length > limit || /[\u0000-\u001f]/.test(text)) throw new Error(`Names and titles must use at most ${limit} plain-text characters.`);
  return text || fallback;
}

/** Only main-line text survives. Headers, comments, and nested variations are not moves. */
function mainLine(source: string): { headers: Record<string, string>; text: string } {
  const headers: Record<string, string> = {};
  let text = ''; let depth = 0; let started = false;
  for (let i = 0; i < source.length;) {
    const c = source[i];
    if (c === '{') {
      const end = source.indexOf('}', i + 1);
      if (end < 0) throw new Error('Close the PGN comment with }.');
      i = end + 1; text += ' '; continue;
    }
    if (c === ';' || (c === '%' && (i === 0 || source[i - 1] === '\n'))) {
      const end = source.indexOf('\n', i); i = end < 0 ? source.length : end + 1; text += ' '; continue;
    }
    if (c === '(') { depth++; i++; continue; }
    if (c === ')') { if (!depth) throw new Error('The PGN has an unmatched variation bracket.'); depth--; i++; text += ' '; continue; }
    if (depth) { i++; continue; }
    if (c === '[') {
      if (started) throw new Error('Paste one game at a time. A second header was found after the moves.');
      const match = source.slice(i).match(/^\[([A-Za-z][A-Za-z0-9_]*)\s+"((?:\\.|[^"\\])*)"\s*\]/);
      if (!match || Object.hasOwn(headers, match[1])) throw new Error('A PGN header is invalid or repeated.');
      headers[match[1]] = match[2].replace(/\\(["\\])/g, '$1'); i += match[0].length; continue;
    }
    if (!/\s/.test(c)) started = true;
    text += c; i++;
  }
  if (depth) throw new Error('Close the PGN variation with ).');
  return { headers, text };
}

export function forcedResult(game: Chess): GameResult | null {
  if (game.isCheckmate()) return game.turn() === 'b' ? '1-0' : '0-1';
  // Threefold repetition and the fifty-move rule permit a claim; they do not force a PGN result.
  return game.isStalemate() || game.isInsufficientMaterial() ? '1/2-1/2' : null;
}

export function parseGamePgn(source: string): GameDraft {
  if (bytes(source) > MAX_PGN_BYTES) throw new Error('This PGN is too large. Paste one game under 128 KiB.');
  const { headers, text } = mainLine(source.replace(/^\uFEFF/, ''));
  if (headers.Variant && !['standard', 'chess'].includes(headers.Variant.toLowerCase())) throw new Error('Only standard chess games are supported.');
  if ((headers.SetUp && !['0', '1'].includes(headers.SetUp)) || (headers.SetUp === '1') !== !!headers.FEN) throw new Error('A custom start needs both [SetUp "1"] and a valid FEN header.');
  let game: Chess;
  try { game = new Chess(headers.FEN || DEFAULT_POSITION); } catch { throw new Error('The starting FEN is not valid.'); }
  const fen = game.fen();
  const tokens = text.replace(/\$\d+/g, ' ').replace(/\d+\.(?:\.\.)?/g, ' ').replace(/\.\.\./g, ' ').trim().split(/\s+/).filter(Boolean);
  let declared: string | undefined;
  const moves: string[] = [];
  for (const raw of tokens) {
    const token = raw.replace(/[!?]+$/g, '');
    if (!token) continue;
    if (declared) throw new Error('Paste one game at a time. Moves were found after the result.');
    if ((results as readonly string[]).includes(token)) { declared = token; continue; }
    if (moves.length >= MAX_PLIES) throw new Error('This game is too long. The limit is 1,000 half-moves.');
    try {
      const move = game.move(token);
      moves.push(`${move.from}${move.to}${move.promotion || ''}`);
    } catch { throw new Error(`Move ${moves.length + 1} (${token.slice(0, 24)}) is not legal. Check the pasted game.`); }
  }
  if (!moves.length) throw new Error('Paste a PGN with at least one move.');
  if (headers.Result && !(results as readonly string[]).includes(headers.Result)) throw new Error('The Result header is not valid.');
  if (headers.Result && declared && headers.Result !== declared) throw new Error('The Result header and final result do not match. Correct the PGN.');
  const result = (declared || headers.Result || forcedResult(game) || '*') as GameResult;
  if (forcedResult(game) && forcedResult(game) !== result) throw new Error('The result does not match the final board. Correct the PGN.');
  return { fen, moves, white: label(headers.White, 'White'), black: label(headers.Black, 'Black'), date: label(headers.Date, '?', 32), result };
}

export function replayGame(record: Pick<GameDraft, 'fen' | 'moves'>, ply = record.moves.length): Chess {
  if (!Number.isInteger(ply) || ply < 0 || ply > record.moves.length) throw new Error('That move is not in this game.');
  const game = new Chess(record.fen);
  for (const move of record.moves.slice(0, ply)) {
    if (!uci.test(move)) throw new Error('This game has an invalid move.');
    game.move({ from: move.slice(0, 2), to: move.slice(2, 4), ...(move[4] ? { promotion: move[4] } : {}) });
  }
  return game;
}

export async function gameIdentity(draft: GameDraft): Promise<string> {
  const content = JSON.stringify([draft.fen, draft.moves, draft.white, draft.black, draft.date, draft.result]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createImportedGame(draft: GameDraft, side: Color): Promise<ImportedGame> {
  if (side !== 'w' && side !== 'b') throw new Error('Choose the side you played.');
  return { ...draft, version: 1, id: await gameIdentity(draft), publicId: publicId(), side,
    title: `${draft.white} – ${draft.black}`.slice(0, 80), favorite: false, deleted: false, revision: 0, editedAt: Date.now() };
}

/** Rebuild only allowed fields; an invalid record cannot poison the rest of a library. */
export function normalizeImportedGame(value: unknown): ImportedGame | null {
  try {
    if (!value || typeof value !== 'object' || bytes(value) > MAX_RECORD_BYTES) return null;
    const v = value as ImportedGame;
    if (v.version !== 1 || !validGameId(v.id) || !validPublicId(v.publicId) || !['w', 'b'].includes(v.side)
      || !Number.isSafeInteger(v.revision) || v.revision < 0 || !Number.isFinite(v.editedAt) || v.editedAt < 0
      || typeof v.fen !== 'string' || v.fen.length > 200 || !Array.isArray(v.moves) || !v.moves.length || v.moves.length > MAX_PLIES
      || !v.moves.every(m => typeof m === 'string' && uci.test(m)) || !results.includes(v.result)
      || typeof v.favorite !== 'boolean' || typeof v.deleted !== 'boolean') return null;
    const game = replayGame(v);
    if (forcedResult(game) && forcedResult(game) !== v.result) return null;
    return { version: 1, id: v.id, publicId: v.publicId, side: v.side, fen: new Chess(v.fen).fen(), moves: [...v.moves],
      white: label(v.white, 'White'), black: label(v.black, 'Black'), date: label(v.date, '?', 32), result: v.result,
      title: label(v.title, 'Saved game'), favorite: v.favorite, deleted: v.deleted, revision: v.revision, editedAt: v.editedAt };
  } catch { return null; }
}

export function editImportedGame(game: ImportedGame, edit: Partial<Pick<ImportedGame, 'side' | 'title' | 'favorite' | 'deleted'>>): ImportedGame {
  const changed = normalizeImportedGame({ ...game, ...edit, editedAt: Date.now() });
  if (!changed) throw new Error('The game could not be saved. Check its title and side.');
  return changed;
}
