import { makeGame, mistakeLoss } from './chess';
import type { Line } from './engine';
import type { Progress, SavedLesson } from './progress';

export type PracticeRecord = { attempts: number; solved: number; independent: number; lastAttempt: number; lastSolved: number };
export function normalizePractice(value: unknown): PracticeRecord | undefined {
  if (!value || typeof value !== 'object') return;
  const record = value as PracticeRecord;
  const number = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 0;
  const attempts = number(record.attempts);
  return { attempts, solved: Math.min(attempts, number(record.solved)), independent: Math.min(attempts, number(record.solved), number(record.independent)), lastAttempt: number(record.lastAttempt), lastSolved: number(record.lastSolved) };
}
/** Unsolved positions come first, then the least recently solved. No answer is used for sorting. */
export function practiceQueue(saved: SavedLesson[], limit = 3): SavedLesson[] {
  const seen = new Set<string>();
  return saved.filter(lesson => { const game = makeGame(lesson.fen); return game.turn() === 'w' && !game.isGameOver(); })
    .sort((a,b) => (a.practice?.lastSolved || 0) - (b.practice?.lastSolved || 0) || (b.count || 1) - (a.count || 1) || b.date.localeCompare(a.date))
    .filter(lesson => { const position=lesson.fen.split(' ').slice(0,4).join(' '); if (seen.has(position)) return false; seen.add(position); return true; }).slice(0,limit);
}
/** Accept sound alternatives, not just an exact move string. Preserve a forced mate when one exists. */
export function acceptsPracticeMove(best: Line, reply: Line | null, afterFen: string): boolean {
  const after = makeGame(afterFen);
  if (after.isCheckmate()) return after.turn() === 'b';
  if (after.isDraw()) return best.score <= 80;
  if (!reply) return false;
  if (best.mate !== undefined && best.mate > 0) return reply.mate !== undefined && reply.mate < 0;
  return mistakeLoss(best, reply) <= 80;
}
export function recordPractice(previous: PracticeRecord | undefined, solved: boolean, independent: boolean, now = Date.now()): PracticeRecord {
  const old = normalizePractice(previous) || { attempts:0, solved:0, independent:0, lastAttempt:0, lastSolved:0 };
  return { attempts:old.attempts+1, solved:old.solved+Number(solved), independent:old.independent+Number(solved && independent), lastAttempt:now, lastSolved:solved ? now : old.lastSolved };
}
/** Practice is a detour: save evidence, but keep the player's real game across refreshes. */
export function preserveGameDuringPractice(current: Progress, original: Progress): Progress {
  const { customFen: _customFen, studyRun: _studyRun, ...progress } = current;
  return { ...progress, lessonId:original.lessonId, moves:[...original.moves], ...(original.customFen ? {customFen:original.customFen} : {}), updatedAt:original.updatedAt, ...(original.studyRun ? {studyRun:original.studyRun} : {}) };
}
