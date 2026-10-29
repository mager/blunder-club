import { makeGame, lessons } from './chess';
import { italian, skills } from './learning';
export type SavedLesson = { id: string; move: string; best: string; text: string; fen: string; date: string; skill?: string; pattern?: string; count?: number };
export type Progress = { lessonId: string; customFen?: string; moves: string[]; saved: SavedLesson[]; retries: number; played: number; sound: boolean; coachMode: 'live' | 'after'; practiced: string[]; updatedAt: number };
export const emptyProgress = (): Progress => ({lessonId:'free',moves:[],saved:[],retries:0,played:0,sound:false,coachMode:'live',practiced:[],updatedAt:0});
export function normalizeProgress(value: unknown): Progress {
  const data = value && typeof value === 'object' ? value as Partial<Progress> : {};
  const clean = emptyProgress();
  const lesson = [italian,...lessons].find(item => item.id === data.lessonId);
  try {
    if (Array.isArray(data.moves) && data.moves.length <= 2000 && data.moves.every(m => typeof m === 'string' && m.length < 16) && (lesson || (data.lessonId === 'saved' && typeof data.customFen === 'string'))) {
      makeGame(lesson?.fen ?? data.customFen!,data.moves);
      clean.lessonId = data.lessonId!; clean.moves = data.moves;
      if (data.lessonId === 'saved') clean.customFen = data.customFen;
    }
  } catch { /* Keep a fresh playable board if a saved game is damaged. */ }
  clean.saved = Array.isArray(data.saved) ? data.saved.filter(item => {
    if (!item || !['id','move','best','text','fen','date'].every(key => typeof item[key as keyof SavedLesson] === 'string') || item.text.length > 3000 || item.id.length > 150) return false;
    try { makeGame(item.fen,[]); return true; } catch { return false; }
  }).slice(0,50).map(item => ({...item,count:Math.min(10000,Math.max(1,Number(item.count)||1))})) : [];
  clean.practiced = Array.isArray(data.practiced) ? [...new Set(data.practiced.filter(id => skills.some(skill => skill.id === id)))] : [];
  clean.retries = Number.isSafeInteger(data.retries) && data.retries! >= 0 ? data.retries! : 0;
  clean.played = Number.isSafeInteger(data.played) && data.played! >= 0 ? data.played! : 0;
  clean.sound = data.sound === true; clean.coachMode = data.coachMode === 'after' ? 'after' : 'live';
  clean.updatedAt = typeof data.updatedAt === 'number' && Number.isFinite(data.updatedAt) ? data.updatedAt : 0;
  return clean;
}
/** Merge guest lessons once. Keep the newer board and avoid double-counting repeats. */
export function mergeProgress(account: Progress, guest: Progress): Progress {
  const combined = new Map(account.saved.map(item => [item.id,item]));
  for (const item of guest.saved) {
    const old = combined.get(item.id);
    combined.set(item.id, {...(old && old.date > item.date ? old : item),count:Math.max(old?.count||1,item.count||1)});
  }
  const useGuestBoard = guest.updatedAt > account.updatedAt || (guest.updatedAt === account.updatedAt && !account.moves.length && guest.moves.length > 0);
  return {...(useGuestBoard ? guest : account),
    saved:[...combined.values()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,50),
    practiced:[...new Set([...account.practiced,...guest.practiced])],
    played:Math.max(account.played,guest.played),retries:Math.max(account.retries,guest.retries)};
}
