import { Chess } from 'chess.js';
import type { Move, PieceSymbol, Square } from 'chess.js';
import type { Line } from './engine';

export const pieceNames: Record<PieceSymbol, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
export { lessons } from './curriculum';
export function makeGame(fen: string, moves: string[] = []) { const game = new Chess(fen); for (const move of moves) game.move(move); return game; }
export function playUci(game: Chess, uci: string): Move {
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), ...(uci[4] ? { promotion: uci[4] } : {}) });
}
export function moveFromLine(fen: string, line: Line): Move { return playUci(new Chess(fen), line.move); }
export function lineToSan(fen: string, pv: string[], limit = 4): string[] {
  const game = new Chess(fen); const san: string[] = [];
  for (const uci of pv.slice(0, limit)) { try { san.push(playUci(game, uci).san); } catch { break; } }
  return san;
}
export function describeMove(fen: string, uci: string): { title: string; detail: string } {
  const game = new Chess(fen); const move = playUci(game, uci);
  if (game.isCheckmate()) return { title: 'Finish the game', detail: `${move.san} is checkmate. The king is in check and has no legal escape.` };
  if (move.isKingsideCastle() || move.isQueensideCastle()) return { title: 'Get your king safe', detail: 'Castling moves your king away from the center and brings a rook into play.' };
  if (move.isPromotion()) return { title: 'Promote your pawn', detail: `Your pawn reaches the last rank and becomes a ${pieceNames[move.promotion!]}.` };
  if (move.captured) return { title: `Take the ${pieceNames[move.captured]}`, detail: `Your ${pieceNames[move.piece]} captures on ${move.to}. Check the reply to see how the exchange continues.` };
  if (game.isCheck()) return { title: 'Make a forcing move', detail: `${move.san} puts the king in check. Your opponent must deal with the threat.` };
  if (move.piece === 'n' || move.piece === 'b') {
    if (move.from[1] === '1' || move.from[1] === '8') return { title: 'Bring a piece into play', detail: `Move your ${pieceNames[move.piece]} off the back rank to ${move.to}, where it can join the game.` };
    return { title: `Reposition your ${pieceNames[move.piece]}`, detail: `From ${move.to}, your ${pieceNames[move.piece]} reaches a different set of squares. Open the possible line to see the replies.` };
  }
  if (move.piece === 'p' && ['d4', 'e4', 'd5', 'e5'].includes(move.to)) return { title: 'Claim the center', detail: `The pawn on ${move.to} controls nearby central squares and opens lines for your pieces.` };
  return { title: `Improve your ${pieceNames[move.piece]}`, detail: `Try ${move.san}. The engine prefers this placement after a short search.` };
}
export function mistakeLoss(before: Line, after: Line): number {
  // Mate distances are not material loss: preserving a forced win/loss is no new blunder.
  if (before.mate !== undefined && after.mate !== undefined && Math.sign(before.mate) === -Math.sign(after.mate)) return 0;
  return Math.max(0, before.score + after.score);
}
export function resultText(game: Chess): string | null {
  if (game.isCheckmate()) return game.turn() === 'b' ? 'Checkmate. You found it.' : 'Checkmate. A lesson to keep.';
  if (game.isStalemate()) return 'Stalemate. No legal moves.';
  if (game.isThreefoldRepetition()) return 'Draw by repetition.';
  if (game.isInsufficientMaterial()) return 'Draw. Not enough pieces to mate.';
  if (game.isDrawByFiftyMoves()) return 'Draw by the fifty-move rule.';
  if (game.isDraw()) return 'The game is a draw.';
  return null;
}
export function attackedPieces(game: Chess): string[] {
  return game.board().flat().filter(piece => piece && piece.color === 'w' && piece.type !== 'k' && game.isAttacked(piece.square, 'b'))
    .map(piece => `${pieceNames[piece!.type]} on ${piece!.square}`);
}
export function squareName(square: Square, game: Chess): string {
  const piece = game.get(square);
  return `${square}${piece ? `, ${piece.color === 'w' ? 'white' : 'black'} ${pieceNames[piece.type]}` : ', empty'}`;
}
