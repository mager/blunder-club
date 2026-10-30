import { Chess, type Color, type Move, type PieceSymbol } from 'chess.js';
export type OpponentLevel = 'casual' | 'club' | 'challenge';
export const opponents = [
  { id: 'casual', name: 'Casual', detail: 'Plays simple moves. Misses tactics.' },
  { id: 'club', name: 'Club', detail: 'Checks your next reply.' },
  { id: 'challenge', name: 'Challenge', detail: 'The strongest engine moves.' },
] as const;
const value: Record<PieceSymbol, number> = { p:100, n:320, b:330, r:500, q:900, k:0 };
const uci = (move: Move) => `${move.from}${move.to}${move.promotion || ''}`;
function position(game: Chess, side: Color): number {
  let score = 0;
  for (const row of game.board()) for (const piece of row) {
    if (!piece) continue;
    const file = piece.square.charCodeAt(0) - 97;
    const rank = Number(piece.square[1]);
    const center = 3.5 - Math.abs(3.5 - file);
    const advance = piece.color === 'w' ? rank - 2 : 7 - rank;
    let bonus = 0;
    if (piece.type === 'p') bonus = advance * 5 + center * 5;
    if (piece.type === 'n' || piece.type === 'b') bonus = center * 8 + (3.5 - Math.abs(4.5 - rank)) * 8;
    score += (piece.color === side ? 1 : -1) * (value[piece.type] + bonus);
  }
  return score;
}
/** Bounded, shallow play. Teaching always uses a separate, full-strength engine. */
export function chooseOpponentMove(fen: string, level: Exclude<OpponentLevel, 'challenge'>, random = Math.random): string | null {
  const game = new Chess(fen);
  if (game.isGameOver()) return null;
  const side = game.turn();
  const candidates = game.moves({verbose:true}).map(move => {
    game.move(move);
    const mate = game.isCheckmate();
    const score = mate ? 100000 : game.isDraw() ? 0 : position(game,side) + (move.isKingsideCastle() || move.isQueensideCastle() ? 35 : 0);
    game.undo();
    return {move,score,mate};
  }).sort((a,b)=>b.score-a.score);
  if (candidates[0].mate) return uci(candidates[0].move);
  if (level === 'club') {
    // Bound the search for responsive play on phones. This is not an Elo rating.
    for (const candidate of candidates.slice(0,16)) {
      game.move(candidate.move);
      let worst = Infinity;
      for (const reply of game.moves({verbose:true})) {
        game.move(reply);
        worst = Math.min(worst,game.isCheckmate() ? -100000 : game.isDraw() ? 0 : position(game,side));
        game.undo();
      }
      candidate.score = Number.isFinite(worst) ? worst : candidate.score;
      game.undo();
    }
    candidates.splice(16);
    candidates.sort((a,b)=>b.score-a.score);
  }
  const margin = level === 'casual' ? 90 : 25;
  const options = candidates.filter(item=>item.score >= candidates[0].score-margin).slice(0,level === 'casual' ? 6 : 3);
  const index = Math.min(options.length-1,Math.max(0,Math.floor(random()*options.length)));
  return uci(options[index].move);
}
