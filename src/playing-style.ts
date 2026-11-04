import { DEFAULT_POSITION } from 'chess.js';
import { replayGame, type ImportedGame } from './imported-games';

export function gameFacts(record: ImportedGame) {
  const moves = replayGame(record).history({ verbose: true });
  const own = moves.filter(move => move.color === record.side);
  const castle = own.find(move => move.isKingsideCastle() || move.isQueensideCastle());
  return { id: record.id, title: record.title, side: record.side, standard: record.fen === DEFAULT_POSITION,
    moves: own.length, first: own[0]?.san || '', checks: own.filter(m => /[+#]/.test(m.san)).length,
    captures: own.filter(m => m.isCapture() || m.isEnPassant()).length,
    castle: castle ? { move: Number(castle.before.split(' ')[5]), san: castle.san, ownMove: own.indexOf(castle) + 1 } : null };
}

export function playingStyle(games: ImportedGame[]) {
  const facts = [...new Map(games.filter(g => !g.deleted).map(g => [g.id, g])).values()].map(gameFacts);
  const opening = facts.filter(g => g.standard);
  const castleEligible = opening.filter(g => g.moves >= 10);
  const late = castleEligible.filter(g => !g.castle || g.castle.ownMove > 10);
  const white = opening.filter(g => g.side === 'w');
  let suggestion: { lesson: string; reason: string; games: string[] } | null = null;
  if (castleEligible.length >= 3 && late.length / castleEligible.length >= 2 / 3) {
    suggestion = { lesson: 'castle-short', reason: `You had not castled by your tenth move in ${late.length} of ${castleEligible.length} eligible games. Try a castling lesson.`, games: late.map(g => g.id) };
  } else if (white.length >= 3) {
    for (const [first, lesson] of [['e4', 'italian'], ['d4', 'queens-gambit']]) {
      const matching = white.filter(g => g.first === first);
      if (matching.length / white.length >= 2 / 3) { suggestion = { lesson, reason: `You opened with ${first} in ${matching.length} of ${white.length} games as White. Explore this setup.`, games: matching.map(g => g.id) }; break; }
    }
  }
  return { version: 1, facts, suggestion, sample: facts.length,
    moves: facts.reduce((n, g) => n + g.moves, 0), checks: facts.reduce((n, g) => n + g.checks, 0), captures: facts.reduce((n, g) => n + g.captures, 0) };
}
