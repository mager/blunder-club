import { lessons, makeGame, playUci } from './chess';
import { italian, skills } from './learning';
export const panels = ['game','account','practice','journal','moves','new','journey','explanation','report'] as const;
export type Panel = typeof panels[number];
export type GameRoute = { lessonId:string; fen?:string; moves:string[]; position?:boolean; panel?:Panel; hint?:boolean; hintMove?:string; recall?:boolean; report?:boolean; review?:number; stage?:0|1|2; candidate?:string; explanation?:string; skill?:string };
export function routeHash(route:GameRoute):string {
  const path=route.position || route.lessonId === 'saved' ? '/position' : route.lessonId === 'italian' ? '/learn/italian' : route.lessonId === 'free' ? '/play' : `/practice/${route.lessonId}`;
  const params=new URLSearchParams();
  if (route.fen) params.set('fen',route.fen);
  if (route.moves.length && !route.position) params.set('moves',route.moves.join(','));
  if (route.lessonId === 'saved' && !route.position) params.set('mode','play');
  if (route.panel) params.set('panel',route.panel);
  if (route.skill && route.panel === 'journey') params.set('skill',route.skill);
  if (route.hint) params.set('hint','1');
  if (route.hint && route.hintMove) params.set('hintMove',route.hintMove);
  if (route.recall) params.set('recall','1');
  if (route.report) params.set('report','1');
  if (route.review !== undefined) params.set('review',String(route.review));
  if (route.stage !== undefined) params.set('stage',String(route.stage));
  if (route.candidate) params.set('candidate',route.candidate);
  if (route.explanation && route.panel === 'explanation') params.set('explain',route.explanation);
  return `#${path}${params.size ? `?${params}` : ''}`;
}
/** Public URLs carry chess state, never account IDs, keys, or private learning records. */
export function readRoute(hash:string):GameRoute|null {
  if (!hash || hash === '#play') return null;
  if (!hash.startsWith('#/') || hash.length > 24000) throw new Error('That game link is not valid. Your saved game is still here.');
  const url=new URL(hash.slice(1),'https://nextmove.invalid');
  const params=url.searchParams; let lessonId:string;
  if (url.pathname === '/play') lessonId='free';
  else if (url.pathname === '/learn/italian') lessonId='italian';
  else if (url.pathname === '/position') lessonId='saved';
  else { const lesson=lessons.find(l=>l.id !== 'free' && url.pathname === `/practice/${l.id}`); if (!lesson) throw new Error('That lesson link was not found. Your saved game is still here.'); lessonId=lesson.id; }
  const fen=lessonId === 'saved' ? params.get('fen') || '' : [italian,...lessons].find(l=>l.id === lessonId)!.fen;
  const moves=params.get('moves')?.split(',') || [];
  if (!fen) throw new Error('That position link is incomplete.');
  if (fen.length > 200 || moves.length > 2000 || moves.some(m=>!m || m.length > 15)) throw new Error('That game link is too long or incomplete.');
  const game=makeGame(fen,moves);
  const position=lessonId === 'saved' && params.get('mode') !== 'play';
  if (position && (moves.length || game.turn() !== 'w' || game.isGameOver())) throw new Error('That practice link needs a position where White can move.');
  const panel=params.get('panel'); if (panel && !panels.includes(panel as Panel)) throw new Error('That view is not available.');
  const rawReview=params.get('review'); const review=rawReview === null ? undefined : Number(rawReview);
  if (review !== undefined && (!Number.isSafeInteger(review) || review < 0 || review % 2 || review >= moves.length)) throw new Error('That move is not in this game.');
  const hintMove=params.get('hintMove') || undefined;
  if (hintMove) {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(hintMove) || game.turn() !== 'w') throw new Error('That hint is not valid.');
    playUci(makeGame(fen,moves),hintMove);
  }
  const candidate=params.get('candidate') || undefined;
  if (candidate) { if (game.turn() !== 'w') throw new Error('That move preview is not valid.'); game.move(candidate); }
  const skill=params.get('skill') || undefined;
  if (skill && !skills.some(item=>item.id === skill)) throw new Error('That place is not on the map.');
  const explanation=params.get('explain') || undefined;
  if (explanation && explanation.length > 4000) throw new Error('That explanation link is too long.');
  const stage=Number(params.get('stage') ?? 1);
  return {lessonId,moves,...(lessonId === 'saved' ? {fen} : {}),position,panel:panel as Panel || undefined,hint:params.get('hint') === '1',recall:params.get('recall') === '1',report:params.get('report') === '1',review,stage:stage === 0 || stage === 2 ? stage : 1,candidate,explanation,skill,hintMove};
}
