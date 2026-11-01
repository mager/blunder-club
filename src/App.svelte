<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowUpRight, ArrowRight, RotateCcw, RefreshCw, Lightbulb, X, ChevronRight, ChevronDown, Map, Volume2, VolumeX, Zap, Bookmark, MoveUpRight, Target, Ellipsis, UserRound, SlidersHorizontal, AudioLines, ListOrdered, Plus, Link } from '@lucide/svelte';
  import type { Square, PieceSymbol, Move } from 'chess.js';
  import { routeHash, readRoute, type GameRoute, type Panel } from './routes';
  import Board from './Board.svelte';
  import LessonLibrary from './LessonLibrary.svelte';
  import {allLessons, studies, findStudy, freePlay} from './curriculum';
  import {acceptsStep, studyPosition, completeStudy, type StudyResults, type StudyRun} from './study';
  import { practiceQueue, acceptsPracticeMove, recordPractice, preserveGameDuringPractice } from './practice';
  import { fitBoard } from './fit-board';
  import SkillMap from './SkillMap.svelte';
  import { italian, classifyMistake, skills } from './learning';
  import Piece from './Piece.svelte';
  import { ChessEngine } from './engine';
  import type { Line } from './engine';
  import { PracticeOpponent } from './opponent-client';
  import { opponents, type OpponentLevel } from './opponent';
  import { rehearsal, needsWarning, assessedLoss, warningText, type TurningPoint } from './coaching';
  import { makeGame, lessons, playUci, moveFromLine, describeMove, lineToSan, mistakeLoss, resultText, attackedPieces, pieceNames } from './chess';

  type Phase = 'loading' | 'ready' | 'thinking' | 'review' | 'over' | 'error' | 'report' | 'warning' | 'practice';
  import { stampBoardProgress, type SavedLesson, type Progress, type CoachMode } from './progress';
  import { createProgressSync, cloudConfigured, type SaveStatus } from './cloud';
  import type { User } from 'firebase/auth';
  let sync: ReturnType<typeof createProgressSync>;
  let account = $state<User | null>(null);
  let saveStatus = $state<SaveStatus>('loading');
  let authBusy = $state(false);
  type Review = { before: string[]; fen: string; move: Move; best: Line; reply: Line; loss: number; shown: boolean };
  let engine: ChessEngine;
  let opponent: PracticeOpponent;
  let request = 0;
  type PracticeSession = { queue: SavedLesson[]; index: number; attempts: number; helped: boolean; solved: number; independent: number; returnTo: Progress };
  let practice = $state<PracticeSession | null>(null);
  let practiceResult = $state<{accepted:boolean; independent:boolean; move:Move; detail:string} | null>(null);
  let practiceComplete = $state(false);
  let activeLesson = $state(lessons[0]);
  let moves = $state<string[]>([]);
  let game = $derived(makeGame(activeLesson.fen, moves));
  let phase = $state<Phase>('loading');
  let lines = $state<Line[]>([]);
  let selected = $state<Square | null>(null);
  let destinations = $derived(selected ? game.moves({ square: selected, verbose: true }).map(move => move.to) : []);
  let lastMove = $derived(game.history({ verbose: true }).at(-1) ?? null);
  let hint = $state<string | null>(null);
  let option = $state<number | null>(null);
  let flipped = $state(false);
  let panel = $state<Panel | null>(null);
  let urlReady=$state(false);
  let navigating=$state(false);
  let lastUrl='';
  let lastRouteContext='';
  let navigationId=0;
  let showIdeas = $state(false);
  let explanationText = $state('');
  let review = $state<Review | null>(null);
  let warning = $state<(TurningPoint & {next:Line[]}) | null>(null);
  let lessonStage = $state<0|1|2>(1);
  let checkingMove = $state<string | null>(null);
  let boardGame = $derived(warning ? rehearsal(warning,lessonStage) : review ? rehearsal(review,lessonStage) : game);
  let boardLastMove = $derived(warning || review ? boardGame.history({verbose:true}).at(-1) ?? null : lastMove);
  let promotion = $state<{ from: Square; to: Square } | null>(null);
  let error = $state('');
  let notification = $state('');
  let saved = $state<SavedLesson[]>([]);
  let skillCounts = $derived(saved.reduce((all, item) => { if (item.skill) all[item.skill] = (all[item.skill] || 0) + (item.count || 1); return all; }, {} as Record<string, number>));
  let nextPractice = $derived(practiceQueue(saved));
  let removedLessons = $state<Record<string, number>>({});
  let lastProgress: Progress | null = null;
  let retries = $state(0);
  let played = $state(0);
  let sound = $state(false);
  let journeySkill = $state('safety');
  let coachMode = $state<CoachMode>('warn');
  let opponentLevel = $state<OpponentLevel>('casual');
  let openingReview = $state<{ before: string[]; move: Move } | null>(null);
  let recall = $state(false);
  let studyResults=$state<StudyResults>({});
  let studyRun=$state<StudyRun|null>(null);
  let study=$derived(findStudy(activeLesson.id));
  let openingDone = $state(false);
  let practiced = $state<string[]>([]);
  let reportProgress = $state('');
  let reportMoves = $state<string[] | null>(null);
  let recommendation = $state<{skill: string; source: string; confidence?: number; action?: string} | null>(null);
  let reviewingReport = $state(false);
  type Moment = TurningPoint;
  let moments = $state<Moment[]>([]);
  const assessed = new Set<number>();
  let openingIndex = $derived(study ? studyPosition(study,openingReview?.before || moves).index : 0);
  let step = $derived(study && !openingDone ? study.steps[openingIndex] : undefined);
  let keyMoments = $derived([...moments].filter(m => m.loss >= 120).sort((a, b) => b.loss - a.loss).slice(0, 3));
  let storageReady = false;
  let audio: AudioContext | null = null;
  let status = $derived(study && openingDone ? 'Lesson complete' : phase === 'practice' ? (practiceComplete ? 'Practice complete' : practiceResult?.accepted ? 'Move found' : 'Try this again') : phase === 'report' ? 'Reviewing your game…' : phase === 'loading' ? 'Loading…' : phase === 'warning' ? 'Move not played' : phase === 'thinking' ? (checkingMove ? 'Checking your move…' : 'Thinking…') : phase === 'review' ? 'Your second chance' : phase === 'over' ? (game.isGameOver() ? 'Game complete' : 'Game paused') : phase === 'error' ? 'Coach is offline' : game.isCheck() ? 'You’re in check' : 'Your move');

  let cueTitle = $derived(practice && phase === 'thinking' && !checkingMove ? 'Getting your position.' : practice && phase === 'ready' && !showIdeas ? 'Find a better move.' : step ? (recall ? 'What comes next?' : step.title) : phase === 'loading' ? 'Getting ready.' : phase === 'thinking' ? (checkingMove ? 'One moment.' : 'Their move.') : showIdeas ? 'Try this idea.' : game.isCheck() ? 'Your king needs you.' : selected ? 'Where will it go?' : moves.length === 0 ? (activeLesson.id === 'free' ? 'Your move.' : activeLesson.focus) : coachMode === 'after' ? 'Over to you.' : 'What changed?');
  let cueText = $derived(practice && phase === 'thinking' && !checkingMove ? 'Look for checks, captures, and threats.' : practice && phase === 'ready' && !showIdeas ? 'Same position. A fresh decision. Check their threats.' : step ? (recall ? 'Find the next move without a hint.' : step.question) : phase === 'loading' ? 'Your board is on its way.' : phase === 'thinking' ? (checkingMove ? `Checking ${checkingMove} before Black replies.` : 'Watch what Black changes.') : showIdeas ? 'Follow the arrow. Or explore another move.' : game.isCheck() ? 'Capture, block, or move your king.' : selected ? 'The dots show legal moves. Choose a square.' : moves.length === 0 ? (activeLesson.id === 'free' ? 'Take the center. Try a pawn or a knight.' : activeLesson.tip.split('. ')[0] + '.') : coachMode === 'after' ? 'We’ll find the turning points after the game.' : 'Check what their last move attacks.');
  function toggleHint() {
    if (showIdeas || hint) { showIdeas = false; hint = null; option = null; return; }
    if (step) openingHint(); else preview(0);
  }
  function showThreats() {
    if (practice) practice.helped=true;
    if(studyRun) {studyRun.helped=true;persist();}
    const targets=attackedPieces(game);
    explain(game.isCheck() ? 'Capture, block, or move your king out of check.' : targets.length ? `Black attacks your ${targets.join(', your ')}. Check defenders before you move.` : 'None of your pieces are directly attacked. Look for checks, captures, and threats.');
  }
  function explain(text:string) { explanationText = text; panel = 'explanation'; }
  function openPanel(node: HTMLDialogElement) {
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    return { destroy() { node.close(); previous?.focus(); } };
  }

  $effect(() => {
    if (!urlReady || navigating || saveStatus === 'loading') return;
    const route:GameRoute={lessonId:activeLesson.id,moves:practice ? [] : reportMoves || openingReview?.before || review?.before || moves,
      ...(activeLesson.id === 'saved' ? {fen:activeLesson.fen} : {}),position:!!practice,panel:panel || undefined,
      hint:phase === 'ready' && !!hint,hintMove:phase === 'ready' ? hint || undefined : undefined,recall,report:!practice && (phase === 'over' || phase === 'report'),
      review:!practice && review ? review.before.length : undefined,stage:warning || review ? lessonStage : undefined,
      candidate:warning?.move.san,explanation:explanationText,skill:panel === 'journey' || panel === 'practice' ? journeySkill : undefined};
    if (review && !practice && !reportMoves) route.moves=[...review.before,review.move.san];
    const hash=routeHash(route);
    const context=[route.lessonId,route.fen,route.position,route.panel,route.review,route.report,route.skill].join('|');
    if (location.hash !== hash) {
      if (!lastUrl || context === lastRouteContext) history.replaceState(null,'',hash);
      else history.pushState(null,'',hash);
    }
    lastUrl=hash; lastRouteContext=context;
  });
  async function visitRoute(route:GameRoute) {
    if (!lastProgress) return;
    const navigation=++navigationId; navigating=true; panel=null; request++;
    try {
      if (route.position && route.fen) {
        const item=saved.find(item=>item.fen === route.fen) || {id:`linked|${route.fen}`,fen:route.fen,move:'',best:'',text:'A shared practice position.',date:new Date().toISOString()};
        await beginPractice([item]);
      } else {
        const {customFen:_customFen,...original}=lastProgress;
        restoreProgress({...original,lessonId:route.lessonId,moves:route.moves,...(route.fen ? {customFen:route.fen} : {})},false);
        recall=!!route.recall;
        if (route.report || route.review !== undefined || route.panel === 'report') await buildReport(); else await prepare();
        if (navigation !== navigationId) return;
        if (route.review !== undefined) {
          const moment=moments.find(item=>item.before.length === route.review);
          if (moment) {inspectMoment(moment);lessonStage=route.stage ?? 1;}
        } else if (route.candidate && phase === 'ready' && lines[0]) {
          const before=[...moves];const current=makeGame(activeLesson.fen,moves);const move=current.move(route.candidate);const best=lines[0];
          if (!current.isGameOver()) {
            const next=await engine.analyze(current.fen());if (navigation !== navigationId) return;
            const point={before,fen:move.before,move,best,reply:next[0],loss:assessedLoss(best,next[0],`${move.from}${move.to}${move.promotion || ''}`,lines)};
            if (needsWarning(point,activeLesson.id,coachMode)) {warning={...point,next};lessonStage=route.stage ?? 0;phase='warning';}
          }
        }
      }
      if (navigation !== navigationId) return;
      if (route.hint && phase === 'ready') {
        if (step) openingHint();
        else {
          let index=route.hintMove ? lines.findIndex(line=>line.move === route.hintMove) : 0;
          if (index < 0 && route.hintMove) {
            const after=makeGame(activeLesson.fen,moves);playUci(after,route.hintMove);
            const reply=after.isGameOver() ? null : (await engine.analyze(after.fen(),1))[0];
            if (navigation !== navigationId) return;
            const restored:Line={move:route.hintMove,pv:[route.hintMove,...(reply?.pv || [])],score:reply ? -reply.score : after.isCheckmate() ? 100000 : 0,depth:reply?.depth || 0,...(reply?.mate !== undefined ? {mate:-reply.mate} : after.isCheckmate() ? {mate:1} : {})};
            lines=[...lines,restored];index=lines.length-1;
          }
          preview(Math.max(0,index));
        }
      }
      explanationText=route.explanation || 'Open a hint, then choose Why? to see a move explanation.';
      journeySkill=route.skill || (route.panel==='practice'?'':'safety');
      panel=route.panel || null;
    } catch { notification='That link could not be opened. Your saved game is still available.'; }
    finally {if(navigation === navigationId) {navigating=false;urlReady=true;}}
  }
  async function copyLink() {
    try {await navigator.clipboard.writeText(location.href);notification='Link copied. It opens this board and view.';}
    catch {notification='Copy the link from your browser’s address bar.';}
  }
  onMount(() => {
    let initial=true;let initialRoute:GameRoute|null=null;
    try {initialRoute=readRoute(location.hash);} catch {notification='That link is not valid. Your saved game is still here.';}
    const onNavigate=()=>{
      if (!urlReady || location.hash === lastUrl) return;
      try {const route=readRoute(location.hash);lastUrl=location.hash;if(route) void visitRoute(route);}
      catch {notification='That link is not valid. Your current game is still here.';history.replaceState(null,'',lastUrl);}
    };
    window.addEventListener('popstate',onNavigate);window.addEventListener('hashchange',onNavigate);
    engine = new ChessEngine(); opponent = new PracticeOpponent();
    sync = createProgressSync({
      apply: data => {restoreProgress(data,false);if(initial && initialRoute) {initial=false;void visitRoute(initialRoute);} else {initial=false;urlReady=true;void prepare();}},
      account: value => { account = value; },
      status: value => {
        saveStatus = value;
        if (value === 'loading') { request++; phase = 'loading'; storageReady = false; }
      },
      error: message => { notification = message; },
    });
    sync.start();
    return () => { navigationId++;window.removeEventListener('popstate',onNavigate);window.removeEventListener('hashchange',onNavigate);request++; sync.dispose(); engine.dispose(); opponent.dispose(); void audio?.close(); };
  });
  function restoreProgress(data: Progress,analyze=true) {
    practice = null; practiceResult = null; practiceComplete = false;
    request++; review = null; warning = null; checkingMove = null; openingReview = null; reportMoves = null; reviewingReport = false;
    promotion = null; moments = []; assessed.clear(); recommendation = null; recall = false;
    activeLesson = data.lessonId === 'saved' && data.customFen
      ? {...lessons[0], id:'saved', title:'Your second chance', fen:data.customFen, tip:'Look for the threat you missed last time. Try the position before asking for a hint.'}
      : allLessons.find(item => item.id === data.lessonId) || lessons[0];
    lastProgress = data; removedLessons = data.removedLessons;
    moves = data.moves; saved = data.saved; retries = data.retries; played = data.played;
    sound = data.sound; coachMode = data.coachMode; opponentLevel = data.opponentLevel; practiced = data.practiced;
    studyResults=data.studyResults || {};
    const restoredStudy=findStudy(activeLesson.id);
    studyRun=restoredStudy ? data.studyRun && data.studyRun.lessonId===restoredStudy.id && JSON.stringify(data.studyRun.moves)===JSON.stringify(moves) ? {...data.studyRun,moves:[...moves]} : {lessonId:restoredStudy.id,moves:[...moves],helped:moves.length>0,mistakes:0,recorded:false} : null;
    openingDone=!!restoredStudy && studyPosition(restoredStudy,moves).complete;
    storageReady = true; if(analyze) void prepare();
  }
  function persist() {
    if (!storageReady) return;
    let data = stampBoardProgress({ lessonId:activeLesson.id, moves:reviewingReport && reportMoves ? reportMoves : openingReview?.before ?? review?.before ?? moves,
      studyResults,...(studyRun ? {studyRun:{...studyRun,moves:[...(openingReview?.before || moves)]}} : {}),
      saved, retries, played, sound, coachMode, opponentLevel, practiced, removedLessons, updatedAt:lastProgress?.updatedAt || 0,
      ...(activeLesson.id === 'saved' ? {customFen:activeLesson.fen} : {}) }, lastProgress);
    if (practice) data = preserveGameDuringPractice(data,practice.returnTo);
    lastProgress = data; sync.save(data);
  }
  async function signIn() {
    authBusy = true;
    try { await sync.login(); }
    catch (error) {
      const code = (error as {code?:string}).code;
      notification = code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
        ? 'Sign-in cancelled. Your guest progress is still here.'
        : code === 'auth/popup-blocked' ? 'Allow the Google sign-in window in your browser, then try again.'
        : 'Google sign-in could not finish. Your progress stays on this device. Please try again.';
    } finally { authBusy = false; }
  }
  async function signOutAccount() {
    authBusy = true;
    try { await sync.logout(); }
    catch { notification = 'Sign-out could not finish. Please try again.'; }
    finally { authBusy = false; }
  }
  function ping(bad = false) {
    if (!sound) return;
    try {
      audio ??= new AudioContext(); void audio.resume();
      const oscillator = audio.createOscillator(); const gain = audio.createGain();
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.frequency.setValueAtTime(bad ? 180 : 520, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(bad ? 110 : 320, audio.currentTime + 0.1);
      gain.gain.setValueAtTime(0.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.13);
      oscillator.start(); oscillator.stop(audio.currentTime + 0.14);
    } catch { /* Sound is optional; chess does not depend on autoplay support. */ }
  }
  function fail(e: unknown, id: number) { if (id === request) { error = e instanceof Error ? e.message : 'Analysis failed. Reload the engine to continue.'; phase = 'error'; } }
  async function prepare() {
    const id = ++request;
    const current = makeGame(activeLesson.fen, moves);
    selected = null; hint = null; option = null; showIdeas = false; checkingMove = null; warning = null; lines = [];
    if(study) {
      const position=studyPosition(study,moves);
      if(position.pendingReply) {const reply=playUci(current,position.pendingReply);moves=[...moves,reply.san];return prepare();}
      if(!position.valid) {activeLesson={...freePlay,id:'saved',fen:activeLesson.fen};studyRun=null;return prepare();}
      openingDone=position.complete;
      if(!position.complete) {const expected=study.steps[position.index];lines=[{move:expected.move,pv:[expected.move,...(expected.reply?[expected.reply]:[])],score:0,depth:0}];}
      phase='ready';persist();return;
    }
    if (current.isGameOver()) { persist(); await buildReport(); return; }
    phase = 'thinking';
    try {
      const result = await engine.analyze(current.fen());
      if (id !== request) return;
      if (current.turn() === 'b') { await botTurn(current, result, id); return; }
      lines = result; phase = 'ready'; persist();
    } catch (e) { fail(e, id); }
  }
  async function botTurn(current: ReturnType<typeof makeGame>, choices: Line[], id: number) {
    if (id !== request) return;
    const uci = (opponentLevel === 'challenge' ? choices[0].move : await opponent.choose(current.fen(),opponentLevel));
    if (id !== request) return;
    const move = playUci(current, uci);
    moves = [...moves, move.san]; ping();
    persist();
    await prepare();
  }
  async function play(from: Square, to: Square, promote?: PieceSymbol) {
    if (phase !== 'ready' || game.turn() !== 'w' || (study && openingDone)) return;
    if (practice) { await playPractice(from,to,promote); return; }
    const before = [...moves]; const previousFen = game.fen(); const best = lines[0];
    const current = makeGame(activeLesson.fen, moves);
    let move: Move;
    try { move = current.move({ from, to, ...(promote ? { promotion: promote } : {}) }); } catch { return; }
    promotion = null; selected = null; hint = null; option = null; showIdeas = false;
    if (study && step) {
      const lessonStep=step;
      const uci=`${move.from}${move.to}${move.promotion || ''}`;
      studyRun ??= {lessonId:study.id,moves:[...before],helped:before.length>0,mistakes:0,recorded:false};
      if(!acceptsStep(lessonStep,previousFen,uci)) {
        studyRun.mistakes++;openingReview={before,move};moves=[...before,move.san];phase='review';persist();return;
      }
      const lesson=study;
      moves=[...before,move.san];played++;ping();
      if(lessonStep.reply) {const reply=playUci(current,lessonStep.reply);moves=[...moves,reply.san];}
      if(studyPosition(lesson,moves).complete) {
        studyResults=completeStudy(studyResults,studyRun);studyRun.recorded=true;
        practiced=[...new Set([...practiced,...lesson.steps.map(item=>item.skill)])];
      }
      persist();await prepare();return;
    }

    const id = ++request; phase = 'thinking'; checkingMove = move.san;
    // Keep the live board and saved game unchanged until the player commits.
    hint = `${move.from}${move.to}${move.promotion || ''}`;
    if (current.isGameOver()) {
      moves = [...before,move.san]; played++; checkingMove = null; ping(); persist(); await buildReport(); return;
    }
    const alreadyPlayed = coachMode !== 'warn';
    if (alreadyPlayed) { moves = [...before,move.san]; played++; checkingMove = null; hint = null; ping(); persist(); }
    try {
      const next = await engine.analyze(current.fen());
      if (id !== request) return;
      checkingMove = null; hint = null;
      const loss = best ? assessedLoss(best,next[0],`${move.from}${move.to}${move.promotion || ''}`,lines) : 0;
      const point = best ? {before,fen:previousFen,move,best,reply:next[0],loss} : null;
      if (point && needsWarning(point,activeLesson.id,coachMode)) {
        warning = {...point,next}; lessonStage = 0; phase = 'warning'; ping(true);
        return;
      }
      await commitMove(before,move,next,point,id,false,alreadyPlayed);
    } catch (e) { checkingMove = null; hint = null; fail(e,id); }
  }
  async function commitMove(before:string[],move:Move,next:Line[],point:TurningPoint|null,id:number,accepted=false,alreadyPlayed=false) {
    if (id !== request) return;
    warning = null; hint = null;
    if (!alreadyPlayed) { moves = [...before,move.san]; played++; ping(); }
    if (point) {
      assessed.add(before.length);
      moments = [...moments.filter(m=>m.before.length !== before.length),point];
      if (point.loss >= 120 && activeLesson.id !== 'italian') recordLesson({...point,shown:false},true);
    }
    if (point && point.loss >= 120 && coachMode === 'live' && activeLesson.id !== 'italian' && !accepted) {
      review = {...point,shown:false}; lessonStage = 1; phase = 'review';
      void chooseNextSkill(id); ping(true); persist();
    } else {
      phase = 'thinking'; persist();
      await botTurn(makeGame(activeLesson.fen,moves),next,id);
    }
  }
  function rethink() { warning = null; hint = null; lessonStage = 1; phase = 'ready'; }
  function showWarningHint() { rethink(); preview(0); }
  function pauseWarnings() { coachMode='after'; rethink(); persist(); notification='Warnings paused. Play on; Rook will review after the game.'; }
  async function acceptWarning() {
    if (!warning || phase !== 'warning') return;
    const point = warning; const id = request;
    phase = 'thinking';
    try { await commitMove(point.before,point.move,point.next,point,id,true); }
    catch (e) { fail(e,id); }
  }
  function replayStage(stage:0|1|2) {
    lessonStage = stage;
    if (review && stage === 2) review = {...review,shown:true};
    ping();
  }
  function onSquare(square: Square) {
    if (phase !== 'ready' || promotion || (study && openingDone)) return;
    if (selected && destinations.includes(square)) {
      const choices = game.moves({ square: selected, verbose: true }).filter(move => move.to === square);
      if (choices.some(move => move.promotion)) promotion = { from: selected, to: square };
      else void play(selected, square);
      return;
    }
    selected = selected === square ? null : game.get(square)?.color === 'w' ? square : null;
    hint = null; option = null; showIdeas = false;
  }
  function preview(index: number) { if (practice) practice.helped = true; if(studyRun) studyRun.helped=true; if (phase !== 'ready') return; if (!lines[index]) return; showIdeas = true; option = index; hint = lines[index].move; selected = null; }
  function playOption() { if (option === null) return; const uci = lines[option].move; void play(uci.slice(0, 2) as Square, uci.slice(2, 4) as Square, uci[4] as PieceSymbol | undefined); }
  function retry() {
    if (practice) { review=null; practiceResult=null; moves=[]; retries++; persist(); void prepare(); return; }
    if (openingReview) { moves = openingReview.before; openingReview = null; retries++; persist(); void prepare(); return; }
    if (!review) return;
    const before = review.before; review = null; reviewingReport = false; reportMoves = null; moments = moments.filter(m => m.before.length < before.length); for (const ply of assessed) if (ply >= before.length) assessed.delete(ply); moves = before; retries++; persist(); void prepare();
  }
  function showConsequence() {
    if (!review) return;
    review = {...review,shown:true}; lessonStage = 2; ping(true);
  }
  function continueGame() {
    if (!review) return;
    const played = [...review.before,review.move.san]; review = null; lessonStage = 1;
    if (reviewingReport && reportMoves) {moves = reportMoves; reviewingReport = false; phase = 'over'; return;}
    moves = played; persist(); void prepare();
  }
  function resumeReport() {
    if (!reportMoves) return;
    moves = [...reportMoves]; reportMoves = null; reviewingReport = false; review = null;
    persist(); void prepare();
  }
  function undo() {
    if (practice) return;
    if (phase !== 'ready' && phase !== 'over') return;
    if (!moves.length) return;
    if(studyRun) studyRun.helped=true;
    const remove = game.turn() === 'w' ? 2 : 1;
    moves = moves.slice(0, Math.max(0, moves.length - remove)); openingDone = false; reportMoves = null; moments = moments.filter(m => m.before.length < moves.length); for (const ply of assessed) if (ply >= moves.length) assessed.delete(ply); retries++; persist(); void prepare();
  }
  function start(lesson: typeof lessons[number]) {
    practice=null; practiceResult=null; practiceComplete=false;
    studyRun=findStudy(lesson.id)?{lessonId:lesson.id,moves:[],helped:false,mistakes:0,recorded:false}:null;
    request++; warning = null; checkingMove = null; lessonStage = 1; recommendation = null; openingReview = null; openingDone = false; recall = false; moments = []; assessed.clear(); reportMoves = null; reviewingReport = false; activeLesson = lesson; moves = []; review = null; promotion = null; panel = null; showIdeas = false;
    persist(); void prepare();
  }
  function recordLesson(r: Review, encounter = false) {
    const best = moveFromLine(r.fen, r.best).san;
    const id = `${r.fen}|${r.move.san}`;
    const pattern = classifyMistake(r.move, r.reply, r.best);
    const previous = saved.find(item => item.id === id);
    if (!previous || encounter) saved = [{ ...(previous?.practice ? {practice:previous.practice} : {}), id, move: r.move.san, best, text: reviewText(r), fen: r.fen, date: new Date().toISOString(), skill: pattern.skill, pattern: pattern.name, count: (previous?.count || 0) + 1 }, ...saved.filter(item => item.id !== id)].slice(0, 50);
    persist();
  }
  function reviewText(r: Review): string {
    const reply = lineToSan(r.move.after, r.reply.pv, 4).join(' → ');
    return `${classifyMistake(r.move, r.reply, r.best).explanation} ${r.move.san} gives your opponent a stronger position. They can play ${reply}. Compare it with ${moveFromLine(r.fen, r.best).san}, the engine’s first choice before your move.`;
  }

  async function buildReport() {
    const id = ++request;
    phase = 'report'; selected = null; hint = null; option = null;
    const playedMoves = [...moves];
    reportMoves = playedMoves;

    try {
      for (let ply = 0; ply < playedMoves.length; ply += 2) {
        if (id !== request) return;
        reportProgress = `Checking your move ${Math.floor(ply / 2) + 1} of ${Math.ceil(playedMoves.length / 2)}`;
        if (assessed.has(ply)) continue;
        const before = playedMoves.slice(0, ply); const current = makeGame(activeLesson.fen, before);
        if (current.isGameOver()) break;
        const best = (await engine.analyze(current.fen(), 1))[0];
        if (id !== request) return;
        const move = current.move(playedMoves[ply]);
        if (current.isGameOver()) { assessed.add(ply); continue; }
        const reply = (await engine.analyze(current.fen(), 1))[0];
        if (id !== request) return;
        moments = [...moments.filter(m => m.before.length !== ply), { before, fen: move.before, move, best, reply, loss: assessedLoss(best,reply,`${move.from}${move.to}${move.promotion || ''}`) }];
        assessed.add(ply);
      }
      if (id !== request) return;
      phase = 'over';
      review = null;
      for (const moment of keyMoments) recordLesson({ ...moment, shown: false });
      persist(); void chooseNextSkill(id);
    } catch (e) { fail(e, id); }
  }
  async function chooseNextSkill(id: number) {
    const evidence = [...moments].filter(m => m.loss >= 120).sort((a,b) => b.loss-a.loss).slice(0, 5);
    if (!evidence.length) { recommendation = null; return; }
    const local = classifyMistake(evidence[0].move, evidence[0].reply, evidence[0].best).skill;
    recommendation = { skill: local, source: 'local' };
    try {
      const result = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000), body: JSON.stringify({ moments: evidence.map(m => ({ fen: m.fen, move: m.move.san, best: moveFromLine(m.fen,m.best).san, line: lineToSan(m.move.after,m.reply.pv,6).join(' '), loss: m.loss, skill: classifyMistake(m.move,m.reply,m.best).skill })), history: skillCounts }) });
      if (!result.ok || id !== request) return;
      const data = await result.json();
      if (id === request && data.source === 'jev' && skills.some(skill => skill.id === data.skill) && typeof data.confidence === 'number') recommendation = { skill: data.skill, source: 'jev', confidence: data.confidence, action: data.action };
    } catch { /* A local lesson is always available, even without the provider. */ }
  }
  function followRecommendation() {
    if (!recommendation) return;
    if (recommendation.action === 'opening_practice') { start(italian); return; }
    if (recommendation.action === 'show_reply' && keyMoments[0]) { inspectMoment(keyMoments[0]); showConsequence(); return; }
    if (recommendation.action === 'retry_position' && keyMoments[0]) {
      const moment = keyMoments[0];
      practiceMoment(moment); return;
    }
    startById(skills.find(skill => skill.id === recommendation?.skill)?.lesson || 'hanging');
  }
  function inspectMoment(moment: Moment) {

    moves = [...moment.before, moment.move.san]; review = { ...moment, shown: false }; lessonStage = 1; reviewingReport = true; phase = 'review';
  }
  function practiceSaved(lesson: SavedLesson) { beginPractice([lesson]); }
  function practiceMoment(moment: Moment) {
    recordLesson({...moment,shown:false});
    const lesson=saved.find(item=>item.id === `${moment.fen}|${moment.move.san}`);
    if (lesson) practiceSaved(lesson);
  }
  function beginPractice(queue = nextPractice) {
    if (!queue.length || !lastProgress) return;
    if (!practice) persist();
    const original = practice?.returnTo || lastProgress;
    practice = {queue:[...queue],index:0,attempts:0,helped:false,solved:0,independent:0,returnTo:original};
    return loadPracticePosition();
  }
  function loadPracticePosition() {
    if (!practice) return;
    request++; review=null; warning=null; openingReview=null; promotion=null; panel=null;  recommendation=null;
    studyRun=null; practiceResult=null; practiceComplete=false; practice.attempts=0; practice.helped=false; openingDone=false;
    const item=practice.queue[practice.index];
    activeLesson={...lessons[0],id:'saved',title:'Your second chance',fen:item.fen};
    moves=[]; moments=[]; assessed.clear(); reportMoves=null; reviewingReport=false;
    return prepare();
  }
  async function playPractice(from: Square,to: Square,promote?: PieceSymbol) {
    const session=practice; const best=lines[0]; if (!session || !best) return;
    const current=makeGame(activeLesson.fen); let move:Move;
    try { move=current.move({from,to,...(promote ? {promotion:promote} : {})}); } catch { return; }
    const id=++request; phase='thinking'; checkingMove=move.san; selected=null; promotion=null; hint=null; option=null; showIdeas=false;
    try {
      const reply=current.isGameOver() ? null : (await engine.analyze(current.fen(),1))[0];
      if (id !== request || practice !== session) return;
      const accepted=acceptsPracticeMove(best,reply,current.fen());
      session.attempts++;
      const independent=accepted && !session.helped && session.attempts === 1;
      const item=session.queue[session.index];
      saved=saved.map(lesson=>lesson.id === item.id ? {...lesson,practice:recordPractice(lesson.practice,accepted,independent)} : lesson);
      if (accepted) { session.solved++; session.independent+=Number(independent); }
      moves=[move.san]; checkingMove=null;
      practiceResult={accepted,independent,move,detail:accepted ? describeMove(move.before,`${move.from}${move.to}${move.promotion || ''}`).detail : current.isDraw() ? 'That ends in a draw. There is a stronger continuation here.' : reply ? classifyMistake(move,reply,best).explanation : 'Try another move.'};
      review=!accepted && reply ? {before:[],fen:move.before,move,best,reply,loss:mistakeLoss(best,reply),shown:false} : null;
      lessonStage=1; phase='practice'; ping(!accepted); persist();
    } catch(e) { checkingMove=null; fail(e,id); }
  }
  function nextPracticePosition() {
    if (!practice || !practiceResult?.accepted) return;
    if (practice.index+1 < practice.queue.length) { practice.index++; loadPracticePosition(); }
    else { practiceComplete=true; practiceResult=null; review=null; phase='practice'; }
  }
  function returnToGame() {
    if (!practice || !lastProgress) return;
    const data=preserveGameDuringPractice({...lastProgress,saved,retries,practiced,sound,coachMode,opponentLevel,removedLessons},practice.returnTo);
    panel=null; restoreProgress(data);
  }
  function startById(id: string) { start(allLessons.find(lesson => lesson.id === id) || lessons[0]); }
  function openingHint() {
    if (!step) return;
    if(studyRun) studyRun.helped=true;
    hint = step.move; selected = null;persist();
  }
  function exitOpening() {
    openingReview = null; const fen=activeLesson.fen;activeLesson=fen===freePlay.fen ? freePlay : {...freePlay,id:'saved',fen};studyRun=null;openingDone=false;persist();void prepare();
  }

  function showPromotion(node: HTMLDialogElement) {
    node.showModal();
    return { destroy() { node.close(); } };
  }

  function reloadEngine() { request++; engine.dispose(); opponent.dispose(); engine = new ChessEngine(); opponent = new PracticeOpponent(); error = ''; void prepare(); }
</script>

<svelte:head><title>Nextmove — Play. See. Try again.</title></svelte:head>

<div class="app-shell" inert={navigating}>
  <header class="game-header">
    <a class="wordmark" href="#play" aria-label="Nextmove home" onclick={(event) => { event.preventDefault(); panel = null; }}><MoveUpRight size={24} strokeWidth={2.5}/><span>nextmove</span></a>
    <button class="session-name" onclick={() => panel = practice ? 'game' : 'new'}>{activeLesson.id === 'free' ? 'Free play' : activeLesson.title}<ChevronDown size={14}/></button>
    <button class="journey-button" aria-label="Your journey" onclick={() => panel='journey'}><Map size={19}/><span>Journey</span></button>
    <button class="account-button" aria-label={account ? 'Your account and saved progress' : 'Sign in and save progress'} onclick={() => panel = 'account'}><span class="save-dot" class:synced={saveStatus === 'saved'}></span><span>{account ? account.displayName?.split(' ')[0] || 'Account' : 'Save progress'}</span><UserRound size={17}/></button>
  </header>

  <main class="game-stage" use:fitBoard inert={saveStatus === 'loading'}>
    <section class="board-column" aria-label="Your chess game">
      <div class="player-strip opponent"><span class="player-id"><span class="player-token dark"><Piece type="k" color="b"/></span><strong>{practice ? 'Your second chance' : study ? (study.kind==='opening' ? 'Opening lesson' : 'Practice challenge') : opponents.find(item=>item.id === opponentLevel)?.name}</strong></span><span>{practice ? `${practice.index+1} / ${practice.queue.length}` : study ? `${Math.min(openingIndex+1,study.steps.length)} / ${study.steps.length}` : 'No clock'}</span></div>
      <div class="board-wrap" class:rehearsing={!!warning || !!review}>
        <Board game={boardGame} {selected} {destinations} lastMove={boardLastMove} hint={(warning || review) && lessonStage === 0 ? `${(warning || review)!.move.from}${(warning || review)!.move.to}` : hint} {flipped} disabled={phase !== 'ready' || !!promotion || !!(study && openingDone)} {onSquare}/>
      </div>
      <div class="player-strip"><span class="player-id"><span class="player-token"><Piece type="k" color="w"/></span><strong>You</strong></span><span class="turn-status" class:busy={phase === 'thinking' || phase === 'loading'} role="status"><span class="status-dot"></span>{status}</span></div>
      {#if warning || review}
        <div class="replay-strip" aria-label="Explore this move">
          <span>Preview</span>
          <button class:active={lessonStage === 0} aria-pressed={lessonStage === 0} onclick={() => replayStage(0)}>Before</button>
          <button class:active={lessonStage === 1} aria-pressed={lessonStage === 1} onclick={() => replayStage(1)}>{(warning || review)?.move.san}</button>
          <button class:active={lessonStage === 2} aria-pressed={lessonStage === 2} onclick={() => replayStage(2)}>{lessonStage === 2 ? lineToSan((warning || review)!.move.after,(warning || review)!.reply.pv,1)[0] : 'Their reply'} <ArrowRight size={14}/></button>
          <button class="replay-menu" onclick={() => panel = 'game'} aria-label="Game menu"><Ellipsis size={21}/></button>
        </div>
      {:else}
      <div class="board-toolbar" aria-label="Game controls">
        <button class:active={showIdeas || !!hint} disabled={phase !== 'ready' || !lines.length} onclick={toggleHint}><Lightbulb size={18}/><span>{showIdeas || hint ? 'Hide hint' : 'Hint'}</span></button>
        {#if practice}{#if !practiceComplete}<button onclick={returnToGame}><RotateCcw size={17}/><span>Back to game</span></button>{/if}{:else}<button aria-label="Take back your last turn" disabled={!moves.length || !['ready','over'].includes(phase)} onclick={undo}><RotateCcw size={17}/><span>Undo</span></button>{/if}
        <button onclick={() => panel = 'game'} aria-label="Game menu"><Ellipsis size={21}/><span>More</span></button>
      </div>
      {/if}
    </section>

    <aside class="coach-dock" class:intervention={phase === 'review' || phase === 'warning'} aria-label="Your chess guide" tabindex="-1">
      <div class="guide-identity"><span class="guide-mark"><AudioLines size={18}/></span><strong>Rook</strong><span>Your guide</span><button aria-label="Coach settings" title="Coach settings" onclick={() => panel = 'game'}><SlidersHorizontal size={16}/></button></div>
      <div class="coach-turn" aria-live="polite">
        {#if phase === 'report'}
          <h1>Finding the turning point.</h1><p class="quiet">{reportProgress || 'Checking your moves…'}</p><div class="thinking-track" aria-hidden="true"></div>
        {:else if phase === 'error'}
          <h1>The engine stopped.</h1><p>{error}</p><button class="primary-button" onclick={reloadEngine}>Try again <RefreshCw size={16}/></button>
        {:else if practiceComplete && practice}
          <h1>Take it into your game.</h1><p>{practice.solved} {practice.solved === 1 ? 'position' : 'positions'} solved. {practice.independent} without help.</p>
          <div class="coach-actions"><button class="primary-button" onclick={returnToGame}>Back to game <ArrowRight size={16}/></button></div>
        {:else if practiceResult}
          <h1>{practiceResult.accepted ? (practiceResult.independent ? 'You found it.' : 'Now you see it.') : 'Look one move further.'}</h1>
          <p>{practiceResult.accepted ? `${practiceResult.move.san} works here.` : practiceResult.detail.split('. ')[0] + '.'}</p>
          <div class="coach-actions">{#if practiceResult.accepted}<button class="primary-button" onclick={nextPracticePosition}>{practice && practice.index+1 < practice.queue.length ? 'Next position' : 'Finish practice'} <ArrowRight size={16}/></button><button class="text-button" onclick={() => {if(practiceResult) explain(practiceResult.detail);}}>Why?</button>{:else}<button class="primary-button" onclick={retry}>Try again <RotateCcw size={16}/></button>{#if review}<button class="text-button" onclick={showConsequence}>See the reply <ArrowRight size={16}/></button>{/if}{/if}</div>
        {:else if warning}
          <h1>Before you play {warning.move.san}.</h1><p>{warningText(warning)}</p>
          <div class="coach-actions"><button class="primary-button" onclick={showWarningHint}>Show a move <Lightbulb size={16}/></button><button class="text-button" onclick={acceptWarning}>Play anyway <ArrowRight size={16}/></button><button class="text-button" onclick={pauseWarnings}>Pause warnings</button></div>

        {:else if openingReview}
          <h1>{game.isStalemate() ? 'That is stalemate.' : 'Try the lesson’s idea.'}</h1><p>{#if game.isStalemate()}Black has no legal move and is not in check. That is a draw. Try a different move.{:else}{openingReview.move.san} is legal. {step?.question}{/if}</p><div class="coach-actions"><button class="primary-button" onclick={retry}>Try again <RotateCcw size={16}/></button><button class="text-button" onclick={() => {retry();openingHint();}}>Show hint <Lightbulb size={16}/></button></div>
        {:else if phase === 'review' && review}
          {@const pattern = classifyMistake(review.move, review.reply, review.best)}
          <h1>{pattern.name}.</h1><p>{pattern.explanation.split('. ')[0]}.</p>

          <div class="coach-actions"><button class="primary-button" onclick={review.shown ? retry : showConsequence}>{review.shown ? 'Try again' : 'See the reply'} {#if review.shown}<RotateCcw size={16}/>{:else}<ArrowRight size={16}/>{/if}</button><button class="text-button" onclick={continueGame}>{reviewingReport ? 'Back to review' : 'Play on'}</button><button class="text-button" onclick={() => {if(review) explain(reviewText(review));}}>Why?</button></div>

        {:else if phase === 'over'}
          <h1>{game.isCheckmate() ? (game.turn() === 'w' ? 'Let’s run it back.' : 'That’s checkmate.') : game.isDraw() ? 'A draw.' : 'The turning points.'}</h1>{#if game.isGameOver()}<p>{resultText(game)}</p>{/if}
          {#if keyMoments.length}<div class="moment-list">{#each keyMoments.slice(0,1) as moment}<button onclick={() => inspectMoment(moment)}><b>{Math.floor(moment.before.length/2)+1}. {moment.move.san}</b><span>{classifyMistake(moment.move,moment.reply,moment.best).name}</span><ArrowRight size={15}/></button>{/each}</div>{:else}<p>No large mistakes found in the positions checked.</p>{/if}
          <div class="coach-actions">{#if reportMoves && !game.isGameOver()}<button class="primary-button" onclick={resumeReport}>Keep playing <ArrowRight size={16}/></button>{:else if keyMoments[0]}<button class="primary-button" onclick={() => practiceMoment(keyMoments[0])}>Practice this <ArrowRight size={16}/></button>{:else}<button class="primary-button" onclick={() => start(lessons[0])}>Play again <ArrowRight size={16}/></button>{/if}{#if keyMoments.length}<button class="text-button" onclick={() => panel='report'}>Full review <ArrowRight size={14}/></button>{/if}</div>

        {:else if openingDone && study}
          <h1>{studyRun?.recorded ? studyRun.helped || studyRun.mistakes ? 'Now you see it.' : 'You found it.' : 'Lesson complete.'}</h1><p>{study.completion}</p>
          <div class="coach-actions"><button class="primary-button" onclick={() => {const next=studies.find(l=>l.id!==study?.id && l.skill===study?.skill && !studyResults[l.id]?.solved) || studies[(studies.findIndex(l=>l.id===study?.id)+1)%studies.length];start(next);}}>Next lesson <ArrowRight size={16}/></button>{#if !game.isGameOver()}<button class="text-button" onclick={exitOpening}>Play from here <ArrowRight size={16}/></button>{/if}<button class="text-button" onclick={() => {if(study) {start(study);recall=true;}}}>Try without hints</button></div>
        {:else}
          <h1>{cueTitle}</h1>{#if !showIdeas}<p>{cueText}</p>{/if}
          {#if step}
            <div class="opening-progress" aria-label={`Lesson step ${Math.min(openingIndex+1,study?.steps.length || 1)} of ${study?.steps.length}`}>{#each study?.steps || [] as item, i}<span class:done={i < openingIndex} class:current={i === openingIndex} title={item.short}></span>{/each}</div>
            {#if hint}<div class="hint-actions"><button class="primary-button" onclick={() => {if(step) void play(step.move.slice(0,2) as Square,step.move.slice(2,4) as Square,step.move[4] as PieceSymbol | undefined);}}>Play {lineToSan(game.fen(),[step.move],1)[0]} <ArrowRight size={16}/></button><button class="text-button" onclick={() => {if(step) explain(`${step.hint} ${step.why}`);}}>Why?</button></div>{/if}
          {:else if showIdeas && phase === 'ready'}
            <div class="idea-choices" aria-label="Moves to explore">{#each lines as line, i}<button class:chosen={option === i} aria-pressed={option === i} onclick={() => preview(i)}>{moveFromLine(game.fen(),line).san}</button>{/each}</div>
            {#if option !== null && lines[option]}<div class="hint-actions"><button class="primary-button" onclick={playOption}>Play {moveFromLine(game.fen(),lines[option]).san} <ArrowRight size={16}/></button><button class="text-button" onclick={() => {if(option !== null) explain(`${describeMove(game.fen(),lines[option].move).detail} One possible line: ${lineToSan(game.fen(),lines[option].pv).join(' → ')}.`);}}>Why? <ArrowUpRight size={14}/></button></div>{/if}
          {/if}
          {#if phase === 'ready' && !showIdeas && !hint}<div class="coach-actions"><button class="primary-button" onclick={toggleHint}>Show hint <Lightbulb size={17}/></button><button class="text-button" onclick={showThreats}>What’s the threat? <ArrowUpRight size={15}/></button></div>{/if}
        {/if}
      </div>
      {#if phase === 'ready' && !step && !showIdeas && activeLesson.id === 'free' && moves.length === 0}<button class="opening-invite" onclick={() => start(italian)}>Learn an opening <ArrowRight size={15}/></button>{/if}
    </aside>
  </main>
</div>

{#if panel}
  <dialog class="game-dialog" class:journey={panel === 'journey'} class:wide={panel === 'practice' || panel === 'journal'} use:openPanel oncancel={() => panel = null} aria-label={panel === 'account' ? 'Account' : panel === 'practice' ? 'Practice' : panel === 'journal' ? 'Saved positions' : panel === 'moves' ? 'Move sheet' : panel === 'new' ? 'New game' : panel === 'journey' ? 'Your journey' : panel === 'explanation' ? 'Move explanation' : panel === 'report' ? 'Game review' : 'Game menu'}>
    <div class="dialog-header"><h2>{panel === 'account' ? 'Your progress' : panel === 'practice' ? 'Choose your next challenge.' : panel === 'journal' ? 'Your positions' : panel === 'moves' ? 'Move sheet' : panel === 'new' ? 'A fresh board.' : panel === 'journey' ? 'Your journey' : panel === 'explanation' ? 'Why this move?' : panel === 'report' ? 'Your turning points' : 'Your game'}</h2><button class="icon-button" aria-label="Back to board" onclick={() => panel = null}><X size={22}/></button></div>
    <div class="dialog-body">
      {#if panel === 'journey'}
        <SkillMap {saved} {practiced} {studyResults} onExplore={(id) => {journeySkill=id;panel='practice';}} bind:selected={journeySkill} onPractice={(items) => beginPractice(practiceQueue(items))}/>
      {:else if panel === 'explanation'}
        <p>{explanationText}</p>
      {:else if panel === 'report'}
        <div class="moment-list">{#each keyMoments as moment}<button onclick={() => {panel=null;inspectMoment(moment);}}><b>{Math.floor(moment.before.length/2)+1}. {moment.move.san}</b><span>{classifyMistake(moment.move,moment.reply,moment.best).name}</span><ArrowRight size={15}/></button>{/each}</div>
        {#if nextPractice.length}<button class="primary-button" onclick={() => beginPractice()}>Practice my mistakes <ArrowRight size={16}/></button>{/if}
        {#if recommendation}<button class="text-button" onclick={() => {panel=null;followRecommendation();}}>Practice {skills.find(s => s.id === recommendation?.skill)?.name.toLowerCase()} <ArrowUpRight size={14}/></button>{/if}
      {:else if panel === 'game'}
        <fieldset class="game-setting" disabled={!!practice || !(['ready','over'].includes(phase))}><legend>When should Rook step in?</legend>
          <div class="mode-switch">{#each [{id:'warn',label:'Before a mistake'},{id:'live',label:'After a mistake'},{id:'after',label:'After the game'}] as mode}<button class:active={coachMode === mode.id} aria-pressed={coachMode === mode.id} onclick={() => {coachMode=mode.id as CoachMode;persist();}}>{mode.label}</button>{/each}</div>
          <p class="setting-note">{coachMode === 'warn' ? 'See a warning. Decide whether to play it.' : coachMode === 'live' ? 'Play your move. Pause to learn from a mistake.' : 'Play a full game. Rook reviews it at the end.'}</p>
        </fieldset>
        <fieldset class="game-setting" disabled={!!practice || !(['ready','over'].includes(phase))}><legend>Your opponent</legend><div class="mode-switch">{#each opponents as level}<button class:active={opponentLevel === level.id} aria-pressed={opponentLevel === level.id} onclick={() => {opponentLevel=level.id;persist();}}>{level.name}</button>{/each}</div><p class="setting-note">{opponents.find(item=>item.id === opponentLevel)?.detail}</p></fieldset>
        {#if !!study}<button class="menu-row" onclick={() => {exitOpening();panel=null;}}>Leave this lesson <ArrowRight size={18}/></button>{/if}
        {#if practice}<button class="menu-row" onclick={returnToGame}>Back to your game <ArrowRight size={18}/></button>{/if}
        <button class="menu-row" disabled={!!practice || !moves.length || !['ready','over'].includes(phase)} onclick={() => {panel=null; review=null; void buildReport();}}>Review this game <Target size={19}/></button>
        <button class="menu-row" onclick={() => panel='journey'}>Your journey <Map size={19}/></button><button class="menu-row" onclick={() => {journeySkill='';panel='practice';}}>Practice <Zap size={19}/></button><button class="menu-row" onclick={() => panel='journal'}>Saved positions <span>{saved.length}</span></button><button class="menu-row" onclick={() => panel='moves'}>Move sheet <ListOrdered size={19}/></button>
        <div class="menu-tools"><button class="secondary-button" onclick={() => flipped = !flipped}><RefreshCw size={17}/>Flip board</button><button class="secondary-button" aria-pressed={sound} onclick={() => {sound=!sound;ping();persist();}}>{#if sound}<Volume2 size={17}/>{:else}<VolumeX size={17}/>{/if}Sound {sound ? 'on' : 'off'}</button></div>
        <button class="menu-row" onclick={copyLink}>Copy link to this view <Link size={19}/></button>
        <button class="menu-row separated" onclick={() => panel='new'}>New game <Plus size={19}/></button>
        <div class="game-menu-links"><a class="license-link" href="/about/">About Nextmove <ArrowUpRight size={12}/></a><a class="license-link" href="/engine/SOURCE-AND-NOTICES.txt" target="_blank" rel="noreferrer">Engine & licenses <ArrowUpRight size={12}/></a></div>
      {:else if panel === 'account'}
        {#if account}<p class="account-name">{account.displayName || 'Signed in'}</p><p class="quiet" role="status">{saveStatus === 'saved' ? 'Progress saved' : saveStatus === 'saving' ? 'Saving…' : saveStatus === 'loading' ? 'Loading progress…' : 'Saved on this device'}</p>{#if saveStatus === 'offline' || saveStatus === 'conflict'}<button class="primary-button" onclick={() => sync.retry()}>Retry cloud save</button>{/if}<button class="secondary-button" disabled={authBusy || saveStatus === 'loading'} onclick={signOutAccount}>Sign out</button>{:else}<p>Keep your positions and progress across devices.</p>{#if cloudConfigured}<button class="primary-button" disabled={authBusy || saveStatus === 'loading'} onclick={signIn}>{authBusy ? 'Opening Google…' : 'Continue with Google'}<ArrowUpRight size={18}/></button>{/if}<p class="quiet">Guest progress stays on this device.</p>{/if}
      {:else if panel === 'moves'}
        {#if moves.length}<div class="move-sheet">{#each moves as move, i}{#if i % 2 === 0}<span>{Math.floor(i / 2)+1}.</span>{/if}<b>{move}</b>{/each}</div>{:else}<p>No moves yet.</p>{/if}
      {:else if panel === 'new'}
        {#if moves.length}<p class="quiet">This replaces the current game. Saved positions stay.</p>{/if}
        <button class="start-choice" onclick={() => start(lessons[0])}><span><strong>Just play</strong><small>You, the board, and Rook.</small></span><ArrowRight size={23}/></button><button class="start-choice" onclick={() => start(italian)}><span><strong>Learn an opening</strong><small>The Italian Game · 6 moves</small></span><ArrowRight size={23}/></button><button class="text-button" onclick={() => {journeySkill='';panel='practice';}}>Browse all lessons <ChevronRight size={16}/></button>
      {:else if panel === 'practice'}
        {#if nextPractice.length}<button class="start-choice" onclick={() => beginPractice()}><span><strong>Your second chance</strong><small>{nextPractice.length} {nextPractice.length === 1 ? 'position' : 'positions'} from your games. Your game stays saved.</small></span><ArrowRight size={20}/></button>{/if}
        <LessonLibrary {studyResults} bind:skill={journeySkill} onStart={startById}/>
      {:else if panel === 'journal'}
        {#if saved.length}<p class="quiet">Find the move yourself. Your current game stays saved.</p><button class="primary-button" disabled={!nextPractice.length} onclick={() => beginPractice()}>Practice my mistakes <ArrowRight size={16}/></button><div class="saved-list">{#each saved as lesson}<article class="saved-position"><div><strong>{lesson.pattern || 'Try this again'}</strong><span>{lesson.practice?.independent ? 'Found without help' : lesson.practice?.solved ? 'Solved with help' : 'Ready to practice'}</span></div><button class="secondary-button" onclick={() => practiceSaved(lesson)}>Try it <RotateCcw size={15}/></button><details class="explanation"><summary>What happened?</summary><p>{lesson.move} → {lesson.best}. {lesson.text}</p><button class="text-button" onclick={() => {removedLessons={...removedLessons,[lesson.id]:Date.now()};saved=saved.filter(l=>l.id!==lesson.id);persist();}}>Remove position <X size={14}/></button></details></article>{/each}</div>{:else}<div class="empty-state"><Bookmark size={32}/><h3>Your games will fill this.</h3><p>Mistakes become positions you can replay.</p><button class="primary-button" onclick={() => panel=null}>Back to the board <ArrowRight size={17}/></button></div>{/if}
      {/if}
    </div>
  </dialog>
{/if}
{#if promotion}<dialog class="promotion-picker" use:showPromotion oncancel={() => promotion=null} aria-label="Choose a promotion piece"><h2>Choose your piece.</h2><div class="promotion-pieces">{#each ['q','r','b','n'] as piece}<button aria-label={`Promote to ${pieceNames[piece as PieceSymbol]}`} onclick={() => {if(promotion) void play(promotion.from,promotion.to,piece as PieceSymbol);}}><Piece type={piece as PieceSymbol} color="w"/></button>{/each}</div><button class="text-button" onclick={() => promotion=null}>Cancel</button></dialog>{/if}
{#if notification}<div class="notification" role="status"><span>{notification}</span><button class="icon-button" aria-label="Dismiss notification" onclick={() => notification=''}><X size={18}/></button></div>{/if}
