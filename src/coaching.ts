import type { Move } from 'chess.js';
import type { Line } from './engine';
import { makeGame, playUci } from './chess';
export type TurningPoint = { before:string[]; fen:string; move:Move; best:Line; reply:Line; loss:number };
/** Rehearsal boards are derived copies. They never change the played game. */
export function rehearsal(point:TurningPoint,stage:0|1|2) {
  const board = makeGame(point.fen);
  if (stage >= 1) board.move(point.move.san);
  if (stage === 2) playUci(board,point.reply.move);
  return board;
}
export function needsWarning(loss:number,lessonId:string,mode:string) {
  return loss >= 120 && lessonId !== 'italian' && mode === 'warn';
}
