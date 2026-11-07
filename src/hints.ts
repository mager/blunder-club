import { Chess } from 'chess.js';
import type { Line } from './engine';
import type { LessonStep } from './lesson-types';
import { playUci } from './chess';

/** A small set of alternatives, never extra moves just to fill three slots. */
export function hintMoves(fen: string, lines: Line[], step?: LessonStep): string[] {
  const board = new Chess(fen);
  if (board.isGameOver()) return [];
  const legal = board.moves({verbose:true});
  const uci = (move: typeof legal[number]) => `${move.from}${move.to}${move.promotion || ''}`;
  const legalMoves = new Set(legal.map(uci));
  if (step) {
    const mates = step.goal === 'mate' ? legal.filter(move => move.san.endsWith('#')).map(uci) : [];
    return [...new Set([step.move, ...(step.alternatives || []), ...mates])].filter(move => legalMoves.has(move)).slice(0,3);
  }
  const candidates = lines.filter(line => legalMoves.has(line.move) && Number.isFinite(line.score));
  const best = candidates[0];
  if (!best) return [];
  return [...new Set(candidates.filter(line => {
    const after = new Chess(fen); playUci(after,line.move);
    if (after.isDraw() && best.score > 60) return false;
    if ((best.mate || 0) > 0) return (line.mate || 0) > 0;
    if ((best.mate || 0) < 0) return line.mate === undefined || line.mate > 0 || line.mate <= best.mate!;
    if (line.mate !== undefined) return line.mate > 0;
    return best.score - line.score <= 60;
  }).map(line => line.move))].slice(0,3);
}
