import type { Move } from 'chess.js';
import type { Line } from './engine';
import { makeGame, playUci, mistakeLoss, lineToSan } from './chess';
export type TurningPoint = { before:string[]; fen:string; move:Move; best:Line; reply:Line; loss:number };
/** Rehearsal boards are derived copies. They never change the played game. */
export function rehearsal(point:TurningPoint,stage:0|1|2) {
  const board = makeGame(point.fen);
  if (stage >= 1) board.move(point.move.san);
  if (stage === 2) playUci(board,point.reply.move);
  return board;
}
/** Compare choices from the same search when available. Never scold the recommended move. */
export function assessedLoss(best:Line, reply:Line, move:string, choices:Line[] = []):number {
  if (move === best.move) return 0;
  const choice=choices.find(line=>line.move === move);
  if (!choice) return mistakeLoss(best,reply);
  return mistakeLoss(best,{...choice,score:-choice.score,...(choice.mate !== undefined ? {mate:-choice.mate} : {})});
}
export function needsWarning(point:TurningPoint,lessonId:string,mode:string) {
  if (lessonId === 'italian' || mode !== 'warn' || point.loss < 180) return false;
  // An existing forced loss is not a fresh mistake. A new mate threat still matters.
  if (point.best.mate !== undefined && point.best.mate < 0 && (point.reply.mate || 0) > 0) return false;
  if ((point.reply.mate || 0) > 0) return true;
  const bound=(score:number)=>Math.max(-500,Math.min(500,score));
  return bound(point.best.score)-bound(point.best.score-point.loss) >= 180;
}
export function warningText(point:TurningPoint) {
  const reply=lineToSan(point.move.after,point.reply.pv,2).join(' → ');
  return `${point.move.san} allows ${reply}. Compare it with ${lineToSan(point.fen,[point.best.move],1)[0]}.`;
}
