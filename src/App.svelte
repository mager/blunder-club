<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowUpRight, ArrowRight, RotateCcw, RefreshCw, Lightbulb, Flag, X, Check, ChevronRight, Send, BookOpen, Volume2, VolumeX, Swords, Zap, Bookmark, MoveUpRight, Asterisk, Target } from '@lucide/svelte';
  import type { Square, PieceSymbol, Move } from 'chess.js';
  import Board from './Board.svelte';
  import SkillMap from './SkillMap.svelte';
  import { italian, openingSteps, classifyMistake, skills } from './learning';
  import Piece from './Piece.svelte';
  import { ChessEngine } from './engine';
  import type { Line } from './engine';
  import { makeGame, lessons, playUci, moveFromLine, describeMove, lineToSan, mistakeLoss, resultText, attackedPieces, pieceNames } from './chess';

  type Phase = 'loading' | 'ready' | 'thinking' | 'review' | 'over' | 'error' | 'report';
  import { stampBoardProgress, type SavedLesson, type Progress } from './progress';
  import { createProgressSync, cloudConfigured, type SaveStatus } from './cloud';
  import type { User } from 'firebase/auth';
  let sync: ReturnType<typeof createProgressSync>;
  let account = $state<User | null>(null);
  let saveStatus = $state<SaveStatus>('loading');
  let authBusy = $state(false);
  type Review = { before: string[]; fen: string; move: Move; best: Line; reply: Line; loss: number; shown: boolean };
  let engine: ChessEngine;
  let request = 0;
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
  let view = $state<'play' | 'practice' | 'journal'>('play');
  let review = $state<Review | null>(null);
  let promotion = $state<{ from: Square; to: Square } | null>(null);
  let error = $state('');
  let notification = $state('');
  let saved = $state<SavedLesson[]>([]);
  let removedLessons = $state<Record<string, number>>({});
  let lastProgress: Progress | null = null;
  let retries = $state(0);
  let played = $state(0);
  let sound = $state(false);
  let query = $state('');
  let answer = $state('');
  let lastQuestion = $state('');
  let lessonSaved = $state(false);
  let coachMode = $state<'live' | 'after'>('live');
  let openingReview = $state<{ before: string[]; move: Move } | null>(null);
  let recall = $state(false);
  let openingDone = $state(false);
  let practiced = $state<string[]>([]);
  let guideNote = $state('');
  let reportProgress = $state('');
  let reportMoves = $state<string[] | null>(null);
  let reportTitle = $state('');
  let recommendation = $state<{skill: string; source: string; confidence?: number; action?: string} | null>(null);
  let reviewingReport = $state(false);
  type Moment = { before: string[]; fen: string; move: Move; best: Line; reply: Line; loss: number };
  let moments = $state<Moment[]>([]);
  const assessed = new Set<number>();
  let openingIndex = $derived(Math.floor(moves.length / 2));
  let step = $derived(activeLesson.id === 'italian' && !openingDone ? openingSteps[openingIndex] : undefined);
  let keyMoments = $derived([...moments].filter(m => m.loss >= 120).sort((a, b) => b.loss - a.loss).slice(0, 3));
  let skillCounts = $derived(saved.reduce((all, item) => { if (item.skill) all[item.skill] = (all[item.skill] || 0) + (item.count || 1); return all; }, {} as Record<string, number>));
  let storageReady = false;
  let audio: AudioContext | null = null;
  let status = $derived(phase === 'report' ? 'Reviewing your game…' : phase === 'loading' ? 'Warming up the coach' : phase === 'thinking' ? 'Checking the board…' : phase === 'review' ? 'Let’s look at that move' : phase === 'over' ? (game.isGameOver() ? 'Game complete' : 'Game paused') : phase === 'error' ? 'Coach is offline' : game.isCheck() ? 'You’re in check' : 'Your move');

  onMount(() => {
    engine = new ChessEngine();
    sync = createProgressSync({
      apply: restoreProgress,
      account: value => { account = value; },
      status: value => {
        saveStatus = value;
        if (value === 'loading') { request++; phase = 'loading'; storageReady = false; }
      },
      error: message => { notification = message; },
    });
    sync.start();
    return () => { request++; sync.dispose(); engine.dispose(); void audio?.close(); };
  });
  function restoreProgress(data: Progress) {
    request++; review = null; openingReview = null; reportMoves = null; reviewingReport = false;
    promotion = null; moments = []; assessed.clear(); recommendation = null; answer = ''; lastQuestion = ''; guideNote = ''; recall = false;
    activeLesson = data.lessonId === 'saved' && data.customFen
      ? {...lessons[0], id:'saved', title:'Your second chance', fen:data.customFen, tip:'Look for the threat you missed last time. Try the position before asking for a hint.'}
      : [italian,...lessons].find(item => item.id === data.lessonId) || lessons[0];
    lastProgress = data; removedLessons = data.removedLessons;
    moves = data.moves; saved = data.saved; retries = data.retries; played = data.played;
    sound = data.sound; coachMode = data.coachMode; practiced = data.practiced;
    openingDone = activeLesson.id === 'italian' && moves.length >= openingSteps.length * 2;
    storageReady = true; void prepare();
  }
  function persist() {
    if (!storageReady) return;
    const data = stampBoardProgress({ lessonId:activeLesson.id, moves:openingReview?.before ?? review?.before ?? moves,
      saved, retries, played, sound, coachMode, practiced, removedLessons, updatedAt:lastProgress?.updatedAt || 0,
      ...(activeLesson.id === 'saved' ? {customFen:activeLesson.fen} : {}) }, lastProgress);
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
    selected = null; hint = null; option = null; lines = [];
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
    // A consistent learning opponent: choose a near-equal second line occasionally.
    const openingReply = activeLesson.id === 'italian' && !openingDone ? openingSteps[Math.floor((moves.length - 1) / 2)]?.reply : undefined;
    const choice = choices[1] && choices[0].score - choices[1].score < 35 && moves.length % 4 === 1 ? choices[1] : choices[0];
    const move = playUci(current, openingReply || choice.move);
    moves = [...moves, move.san]; ping();
    if (activeLesson.id === 'italian' && moves.length === openingSteps.length * 2 && !openingDone) { openingDone = true; practiced = [...new Set([...practiced, 'center', 'development', 'king'])]; }
    persist();
    await prepare();
  }
  async function play(from: Square, to: Square, promote?: PieceSymbol) {
    if (phase !== 'ready' || game.turn() !== 'w') return;
    const before = [...moves]; const previousFen = game.fen(); const best = lines[0];
    const current = makeGame(activeLesson.fen, moves);
    let move: Move;
    try { move = current.move({ from, to, ...(promote ? { promotion: promote } : {}) }); } catch { return; }
    promotion = null; selected = null; hint = null; option = null; answer = ''; lastQuestion = '';
    if (step && `${move.from}${move.to}${move.promotion || ''}` !== step.move) {
      openingReview = { before, move }; moves = [...moves, move.san]; selected = null; phase = 'review'; persist(); return;
    }
    if (step) guideNote = step.after;
    moves = [...moves, move.san]; played++; ping();
    const id = ++request; phase = 'thinking'; lines = [];
    if (current.isGameOver()) { persist(); await buildReport(); return; }
    try {
      const next = await engine.analyze(current.fen());
      if (id !== request) return;
      const loss = best ? mistakeLoss(best, next[0]) : 0;
      if (best) {
        assessed.add(before.length);
        moments = [...moments.filter(m => m.before.length !== before.length), { before, fen: previousFen, move, best, reply: next[0], loss }];
        if (loss >= 120 && activeLesson.id !== 'italian') recordLesson({ before, fen: previousFen, move, best, reply: next[0], loss, shown: false }, true);
      }
      if (best && loss >= 120 && coachMode === 'live' && activeLesson.id !== 'italian') {
        review = { before, fen: previousFen, move, best, reply: next[0], loss, shown: false };
        phase = 'review'; lessonSaved = false; saveLesson(); void chooseNextSkill(id); ping(true); persist();
      } else { await botTurn(current, next, id); }
    } catch (e) { fail(e, id); }
  }
  function onSquare(square: Square) {
    if (phase !== 'ready' || promotion) return;
    if (selected && destinations.includes(square)) {
      const choices = game.moves({ square: selected, verbose: true }).filter(move => move.to === square);
      if (choices.some(move => move.promotion)) promotion = { from: selected, to: square };
      else void play(selected, square);
      return;
    }
    selected = selected === square ? null : game.get(square)?.color === 'w' ? square : null;
    hint = null; option = null;
  }
  function preview(index: number) { if (phase !== 'ready') return; option = index; hint = lines[index].move; selected = null; }
  function playOption() { if (option === null) return; const uci = lines[option].move; void play(uci.slice(0, 2) as Square, uci.slice(2, 4) as Square, uci[4] as PieceSymbol | undefined); }
  function retry() {
    if (openingReview) { moves = openingReview.before; openingReview = null; retries++; persist(); void prepare(); return; }
    if (!review) return;
    const before = review.before; review = null; reviewingReport = false; reportMoves = null; moments = moments.filter(m => m.before.length < before.length); for (const ply of assessed) if (ply >= before.length) assessed.delete(ply); moves = before; retries++; answer = ''; lastQuestion = ''; persist(); void prepare();
  }
  function showConsequence() {
    if (!review || review.shown) return;
    const current = makeGame(activeLesson.fen, moves);
    const reply = playUci(current, review.reply.move);
    moves = [...moves, reply.san]; review = { ...review, shown: true }; ping(true);
  }
  function continueGame() { if (!review) return; review = null; if (reviewingReport && reportMoves) { moves = reportMoves; reviewingReport = false; phase = 'over'; return; } persist(); void prepare(); }
  function resumeReport() {
    if (!reportMoves) return;
    moves = [...reportMoves]; reportMoves = null; reviewingReport = false; review = null;
    persist(); void prepare();
  }
  function undo() {
    if (phase !== 'ready' && phase !== 'over') return;
    if (!moves.length) return;
    const remove = game.turn() === 'w' ? 2 : 1;
    moves = moves.slice(0, Math.max(0, moves.length - remove)); openingDone = false; reportMoves = null; moments = moments.filter(m => m.before.length < moves.length); for (const ply of assessed) if (ply >= moves.length) assessed.delete(ply); retries++; answer = ''; lastQuestion = ''; persist(); void prepare();
  }
  function start(lesson: typeof lessons[number]) {
    request++; recommendation = null; openingReview = null; openingDone = false; recall = false; guideNote = ''; moments = []; assessed.clear(); reportMoves = null; reviewingReport = false; activeLesson = lesson; moves = []; review = null; promotion = null; answer = ''; lastQuestion = ''; view = 'play';
    persist(); void prepare();
  }
  function recordLesson(r: Review, encounter = false) {
    const best = moveFromLine(r.fen, r.best).san;
    const id = `${r.fen}|${r.move.san}`;
    const pattern = classifyMistake(r.move, r.reply, r.best);
    const previous = saved.find(item => item.id === id);
    if (!previous || encounter) saved = [{ id, move: r.move.san, best, text: reviewText(r), fen: r.fen, date: new Date().toISOString(), skill: pattern.skill, pattern: pattern.name, count: (previous?.count || 0) + 1 }, ...saved.filter(item => item.id !== id)].slice(0, 50);
    persist();
  }
  function saveLesson() {
    if (!review) return;
    recordLesson(review); lessonSaved = true;
  }
  function reviewText(r: Review): string {
    const reply = lineToSan(r.move.after, r.reply.pv, 4).join(' → ');
    return `${classifyMistake(r.move, r.reply, r.best).explanation} ${r.move.san} gives your opponent a stronger position. They can play ${reply}. Compare it with ${moveFromLine(r.fen, r.best).san}, the engine’s first choice before your move.`;
  }
  function ask(question: string) {
    if (phase !== 'ready' && phase !== 'review') return;
    const text = question.trim(); if (!text) return;
    lastQuestion = text; query = '';
    if (step && /why|plan|position|help|best|idea|opening/i.test(text)) { answer = `${step.why} ${step.watch}`; } else if (/threat|attack|danger|safe|check/i.test(text)) {
      const targets = attackedPieces(game);
      answer = game.isCheck() ? 'Your king is in check. You must capture the checking piece, block the check, or move your king. Select your pieces to see legal escapes.' : targets.length ? `Black attacks your ${targets.join(', your ')}. An attacked piece is not always lost: look for defenders and check the next exchange.` : 'None of your pieces are directly attacked. Look for checks, captures, and threats before choosing a move.';
    } else if (/castle|castling/i.test(text)) {
      const can = game.moves().filter(m => m.startsWith('O-O'));
      answer = can.length ? `Castling is legal now: ${can.join(' or ')}. Select your king and move it two squares toward the rook.` : 'You cannot castle in this position. The king and rook must not have moved, the path must be clear, and the king cannot start in, cross, or land in check.';
    } else if (/hint|move|why|plan|position|help|best|idea/i.test(text)) {
      const fen = review?.fen ?? game.fen(); const line = review?.best ?? lines[0];
      if (line) { const explanation = describeMove(fen, line.move); answer = `${explanation.detail} One engine line is ${lineToSan(fen, line.pv).join(' → ')}. This is a short analysis, not a promise of your opponent’s reply.`; }
      else answer = 'Let the engine finish checking this position first.';
    } else if (/knight|bishop|rook|queen|pawn|king/i.test(text)) {
      answer = 'Knights jump in an L shape. Bishops move diagonally. Rooks move along ranks and files. Queens combine rook and bishop moves. Kings move one square; pawns move forward and capture diagonally. Select a piece to see its legal moves.';
    } else { answer = 'I’m the local v1 coach. I can explain move options, attacked pieces, castling, and piece movement. Try “What is the threat?” or “Why this move?”'; }
  }

  async function buildReport() {
    const id = ++request;
    phase = 'report'; selected = null; hint = null; option = null;
    const playedMoves = [...moves];
    reportMoves = playedMoves;
    const fullGame = makeGame(activeLesson.fen, playedMoves);
    reportTitle = resultText(fullGame) || 'Game paused. Let’s learn from it.';
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
        moments = [...moments.filter(m => m.before.length !== ply), { before, fen: move.before, move, best, reply, loss: mistakeLoss(best, reply) }];
        assessed.add(ply);
      }
      if (id !== request) return;
      phase = 'over';
      for (const moment of keyMoments) { review = { ...moment, shown: false }; saveLesson(); }
      review = null; persist(); void chooseNextSkill(id);
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
      start({ ...lessons[0], id: 'saved', title: 'Your second chance', fen: moment.fen, tip: 'Try this position again. Look for checks, captures, and threats before moving.' }); return;
    }
    startById(skills.find(skill => skill.id === recommendation?.skill)?.lesson || 'hanging');
  }
  function inspectMoment(moment: Moment) {
    moves = [...moment.before, moment.move.san]; review = { ...moment, shown: false }; reviewingReport = true; phase = 'review'; lessonSaved = true;
  }
  function practiceSaved(lesson: SavedLesson) {
    start({ id: 'saved', title: 'Your second chance', detail: 'A position from your own game.', fen: lesson.fen, focus: lesson.pattern || 'Look again', tip: 'You have seen this position before. Check the threats and find a better move. Ask for a hint only if you need one.' });
  }
  function startById(id: string) { start([italian, ...lessons].find(lesson => lesson.id === id) || lessons[0]); }
  function openingHint() {
    if (!step) return;
    hint = step.move; answer = step.why; lastQuestion = 'The idea behind this move';
  }
  function exitOpening() {
    openingReview = null; activeLesson = lessons[0]; openingDone = false; guideNote = ''; persist(); void prepare();
  }

  function showPromotion(node: HTMLDialogElement) {
    node.showModal();
    return { destroy() { node.close(); } };
  }
  function jumpTo(selector: string) {
    document.querySelector(selector)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  function reloadEngine() { request++; engine.dispose(); engine = new ChessEngine(); error = ''; void prepare(); }
</script>

<svelte:head><title>Blunder School — Bad moves. Better chess.</title></svelte:head>

<div class="app-shell">
  <header class="site-header">
    <a class="brand" href="#play" onclick={(event) => { event.preventDefault(); view = 'play'; }} aria-label="Blunder School home">
      <span class="brand-mark"><Piece type="n" color="b" /></span><span>BLUNDER<span class="brand-second">SCHOOL<span class="brand-period">.</span></span></span>
    </a>
    <nav aria-label="Main navigation">
      <button class:active={view === 'play'} onclick={() => view = 'play'}><Swords size={16} />Play & learn</button>
      <button class:active={view === 'practice'} onclick={() => view = 'practice'}><Zap size={16} />Learn</button>
      <button class:active={view === 'journal'} onclick={() => view = 'journal'}><BookOpen size={16} />Your lessons{#if saved.length}<span class="count">{saved.length}</span>{/if}</button>
    </nav>
    <div class="account-control">
      {#if account}<span class="account-name">{account.displayName?.split(' ')[0] || 'Your account'}</span><span class="save-status" role="status">{saveStatus === 'saved' ? 'Progress saved' : saveStatus === 'saving' ? 'Saving…' : saveStatus === 'loading' ? 'Loading progress…' : 'Saved on this device'}</span><button class="text-button" disabled={authBusy || saveStatus === 'loading'} onclick={signOutAccount}>Sign out</button>
      {:else if cloudConfigured}<button class="google-signin" disabled={authBusy || saveStatus === 'loading'} onclick={signIn}>Continue with Google <ArrowUpRight size={14}/></button><span class="save-status">Guest progress stays on this device</span>
      {:else}<span class="save-status">Progress saved on this device</span>{/if}
      {#if account && (saveStatus === 'offline' || saveStatus === 'conflict')}<button class="text-button" onclick={() => sync.retry()}>Retry cloud sync</button>{/if}
    </div>
  </header>

  <main inert={saveStatus === 'loading'}>
    {#if view === 'play'}
      <section class="intro" aria-label="Welcome">
        <h1>BAD MOVES.<br /><span>BETTER CHESS.</span></h1>
        <div class="intro-note"><span class="drawn-arrow" aria-hidden="true"><MoveUpRight size={31} strokeWidth={1.5} /></span><p>No clock. No judgment.<br />Just you, the board, and your next good idea.</p></div>
        <div class="session-label"><span class="live-dot"></span> LEARNING MODE <small>Mistakes come with a second chance.</small></div>
      </section>
      <div class="session-controls">{#if activeLesson.id === 'italian'}<div class="guided-mode"><strong>Guided opening</strong><span>Learn one idea at a time.</span><button class="text-button" disabled={!['ready','review'].includes(phase)} onclick={exitOpening}>Switch to free play <ArrowRight size={14}/></button></div>{:else}<div class="mode-switch" aria-label="Coaching mode"><button class:active={coachMode === 'live'} aria-pressed={coachMode === 'live'} onclick={() => { coachMode = 'live'; persist(); }}>Coach as I play</button><button class:active={coachMode === 'after'} aria-pressed={coachMode === 'after'} onclick={() => { coachMode = 'after'; persist(); }}>Play first. Review after.</button></div>{/if}<button class="text-button" disabled={!moves.length || !['ready','over'].includes(phase)} onclick={() => { review = null; void buildReport(); }}>Review this game <ArrowUpRight size={15}/></button></div>
      {#if activeLesson.id === 'italian'}<div class="opening-path"><div><strong>THE ITALIAN GAME</strong><span>{recall ? 'Recall round · find the ideas yourself' : 'Your first opening · learn the reason for every move'}</span></div><ol>{#each openingSteps as stage, i}<li class:done={i < openingIndex} class:current={i === openingIndex && !openingDone}><span>{#if i < openingIndex}<Check size={11}/>{:else}{i+1}{/if}</span>{stage.short}</li>{/each}</ol></div>{/if}
      <div class="mobile-coach"><button onclick={() => jumpTo('.coach-panel')}><Lightbulb size={16}/><span><strong>Rook’s corner</strong><small>{step?.question || (phase === 'review' ? 'A mistake worth a second look.' : phase === 'over' ? 'Your game review is ready.' : 'Checks. Captures. Threats. What do you see?')}</small></span><ChevronRight size={16}/></button><button class="back-to-board" onclick={() => jumpTo('.board-column')}>Board</button></div>
      <div class="play-layout">
        <section class="board-column" aria-label="Your game">
          <div class="player-row opponent">
            <span class="player-avatar bot"><Swords size={20} /></span><div><strong>The house</strong><span>Stockfish Lite · no clock</span></div>
            <span class="side-label">BLACK</span>
          </div>
          <div class="board-wrap">
            <Board {game} {selected} {destinations} {lastMove} {hint} {flipped} disabled={phase !== 'ready' || !!promotion} {onSquare} />
            {#if promotion}
              <dialog class="promotion-picker" use:showPromotion oncancel={(event) => { event.preventDefault(); promotion = null; }} aria-label="Choose a promotion piece"><h2>Pick your new piece.</h2><div class="promotion-pieces">{#each ['q', 'r', 'b', 'n'] as piece}<button aria-label={`Promote to ${pieceNames[piece as PieceSymbol]}`} onclick={() => { if (promotion) void play(promotion.from, promotion.to, piece as PieceSymbol); }}><Piece type={piece as PieceSymbol} color="w" /></button>{/each}</div><button class="text-button" onclick={() => promotion = null}>Cancel</button></dialog>
            {/if}
          </div>
          <div class="player-row you"><span class="player-avatar"><Piece type="n" color="w" small /></span><div><strong>You <span class="you-badge">THE LEARNER</span></strong><span>{game.isCheck() && game.turn() === 'w' ? 'Your king needs you.' : 'Every good player started here.'}</span></div><span class="turn-status" class:busy={phase === 'thinking'}><span class="live-dot"></span>{status}</span></div>
          <div class="board-tools">
            <button onclick={() => hint ? (hint = null, option = null) : step ? openingHint() : preview(0)} disabled={phase !== 'ready' || !lines.length}><Lightbulb size={17} />{hint ? 'Hide hint' : 'Give me a hint'}</button>
            <div class="tool-group"><button title="Take back your last turn" aria-label="Take back your last turn" onclick={undo} disabled={!moves.length || !['ready', 'over'].includes(phase)}><RotateCcw size={17} /></button><button title="Flip board" aria-label="Flip board" onclick={() => flipped = !flipped}><RefreshCw size={16} /></button><button title={sound ? 'Mute move sounds' : 'Enable move sounds'} aria-label={sound ? 'Mute move sounds' : 'Enable move sounds'} aria-pressed={sound} onclick={() => { sound = !sound; ping(); persist(); }}>{#if sound}<Volume2 size={17} />{:else}<VolumeX size={17} />{/if}</button><span class="tool-divider"></span><button onclick={() => view = 'practice'}><Flag size={15} /><span>New game</span></button></div>
          </div>
          <details class="move-history"><summary>Move sheet <span>{moves.length ? `${Math.ceil(moves.length / 2)} ${moves.length <= 2 ? 'turn' : 'turns'}` : 'The story starts with your first move.'}</span></summary><div class="notation">{#each moves as move, i}{#if i % 2 === 0}<span class="move-number">{Math.floor(i / 2) + 1}.</span>{/if}<span>{move}</span>{/each}{#if !moves.length}<p>No moves yet. Select a white piece to begin.</p>{/if}</div></details>
        </section>

        <aside class="coach-panel" aria-label="Chess coach">
          <div class="coach-header"><div class="coach-avatar"><Piece type="r" color="b" /></div><div><h2>YOUR CORNER.</h2><span>Rook · your local chess coach</span></div><Asterisk class="coach-star" size={34} strokeWidth={1.5}/></div>
          <div class="coach-content" aria-live="polite" aria-atomic="false">
            {#if phase === 'report'}
              <div class="end-mark"><Target size={32}/></div><h3 class="coach-title">FINDING THE<br />TURNING POINTS.</h3><p class="coach-copy">{reportProgress || 'Looking back through your game.'}</p><p class="analysis-note">The engine checks each of your moves. A long game can take a little time.</p>
            {:else if openingReview}
              <div class="review-heading"><span class="review-symbol">!?</span><span>A different idea.</span></div><h3 class="coach-title">BACK TO<br />THE PLAN.</h3><p class="coach-copy">{openingReview.move.san} is a legal move. It takes us away from this Italian Game practice line. That alone does not make it a blunder.</p><p class="coach-copy">{openingSteps[Math.floor(openingReview.before.length / 2)]?.why}</p><button class="primary-button" onclick={retry}>Try the opening idea again <RotateCcw size={17}/></button><button class="text-button" onclick={exitOpening}>Keep my move and play freely <ArrowRight size={14}/></button>
            {:else if phase === 'error'}
              <div class="coach-message"><h3>A small timeout.</h3><p>{error}</p><button class="primary-button" onclick={reloadEngine}>Reload engine <RefreshCw size={16}/></button></div>
            {:else if phase === 'review' && review}
              <div class="review-heading"><span class="review-symbol">?!</span><span>{classifyMistake(review.move, review.reply, review.best).name}</span></div>
              <h3 class="coach-title">LET’S RUN<br />THAT BACK.</h3><p class="coach-copy">{reviewText(review)}</p>
              <div class="review-line"><span>YOU PLAYED <strong>{review.move.san}</strong></span><ArrowRight size={17}/><span>TRY INSTEAD <strong>{moveFromLine(review.fen, review.best).san}</strong></span></div>
              <p class="analysis-note">{review.reply.mate && review.reply.mate > 0 ? `Black can force mate in ${review.reply.mate}.` : `The short search estimates a loss of ${Math.min(review.loss / 100, 99).toFixed(1)} pawns of position value.`}</p>
              <button class="primary-button" onclick={retry}>Take it back. Try again. <RotateCcw size={17} /></button>
              <div class="review-actions"><button class="secondary-button" onclick={showConsequence} disabled={review.shown}>{review.shown ? 'Reply shown on the board' : 'Show their reply'}<ArrowUpRight size={15} /></button><button class="text-button" onclick={continueGame}>{reviewingReport ? 'Back to report' : 'Play on'} <ArrowRight size={14} /></button></div>
              <button class="save-lesson" onclick={saveLesson} disabled={lessonSaved}>{#if lessonSaved}<Check size={16}/>Lesson saved{:else}<Bookmark size={16}/>Keep this lesson{/if}</button>
            {:else if phase === 'over'}
              <div class="end-mark"><Flag size={32} /></div><h3 class="coach-title">HERE’S WHERE<br />IT TURNED.</h3><p class="coach-copy">{reportTitle}</p>
              {#if keyMoments.length}<p class="report-intro">The largest changes the engine found. Pick a moment, see the reply, then try a better idea.</p><div class="report-moments">{#each keyMoments as moment}{@const pattern = classifyMistake(moment.move, moment.reply, moment.best)}<button onclick={() => inspectMoment(moment)}><span class="moment-turn">{Math.floor(moment.before.length / 2)+1}.</span><span><strong>{pattern.name}</strong><small>{moment.move.san} · {skills.find(skill => skill.id === pattern.skill)?.name}</small></span><ArrowUpRight size={19}/></button>{/each}</div><p class="analysis-note">These are short engine searches, not a complete verdict on your game. The positions are saved in Your lessons.</p>{:else}<p class="coach-copy">No large mistakes were found in the positions checked. Keep looking for checks, captures, and threats.</p>{/if}
              {#if recommendation}{@const skill = skills.find(item => item.id === recommendation?.skill)!}<div class="next-skill"><span>{recommendation.source === 'jev' ? 'JEV’S NEXT STEP' : 'YOUR NEXT STEP'}</span><h4>{skill.name}</h4><p>{skill.text}</p><button class="primary-button" onclick={followRecommendation}>{recommendation.action === 'retry_position' ? 'Retry my position' : recommendation.action === 'show_reply' ? 'See the missed reply' : 'Practice this idea'} <ArrowRight size={17}/></button><small>{recommendation.source === 'jev' ? 'Selected by Jev from your game evidence.' : 'Selected by the local teaching rules.'}</small></div>{:else}<button class="primary-button" onclick={() => view = 'practice'}>Find my next lesson <ArrowRight size={17}/></button>{/if}{#if reportMoves && !game.isGameOver()}<button class="secondary-button" onclick={resumeReport}>Continue this game <ArrowRight size={16}/></button>{/if}<button class="secondary-button" onclick={() => start(lessons[0])}>Play another game <RefreshCw size={16}/></button>
            {:else if openingDone && activeLesson.id === 'italian'}
              <div class="end-mark"><Check size={32}/></div><h3 class="coach-title">A PLAN.<br />NOT A SCRIPT.</h3><p class="coach-copy">You claimed the center, developed three pieces, and castled. That is the point of this opening. Your opponent will not always play this line.</p><ul class="opening-recap"><li>Center: a pawn on e4, supported by d3.</li><li>Development: two knights and a bishop are active.</li><li>King safety: your king is castled.</li></ul><button class="primary-button" onclick={() => { start(italian); recall = true; }}>Try it without hints <RotateCcw size={17}/></button><button class="secondary-button" onclick={exitOpening}>Play on from this position <ArrowRight size={16}/></button>
            {:else if step}
              <div class="opening-mission"><span class="mission-number">{String(openingIndex + 1).padStart(2, '0')}<small>/ 06</small></span><h3>{recall ? 'What comes next?' : step.title}</h3></div><p class="coach-copy">{recall ? 'Use the ideas you learned: center, active pieces, safe king. Find the next move without looking at the answer.' : step.question}</p>
              {#if guideNote}<p class="last-idea"><Check size={15}/>{guideNote}</p>{/if}
              {#if !recall}<div class="why-this"><h4>WHY THIS MATTERS</h4><p>{step.why}</p></div>{/if}
              <button class="secondary-button" disabled={phase !== 'ready'} onclick={openingHint}>Show me the idea <Lightbulb size={16}/></button><p class="option-help">{phase === 'ready' ? 'Make your move on the board. You have time.' : 'Setting up the next position…'}</p>
            {:else if coachMode === 'after' && option === null}
              <div class="coach-message"><span class="speech-marker" aria-hidden="true">“</span><h3>Play your game.<br />I’m paying attention.</h3><p>I’ll keep the analysis for the review. Your moves will show us what to work on next.</p></div><div class="preflight"><h3>BEFORE YOU MOVE</h3><ol><li>What did their last move threaten?</li><li>Is the square I want to use safe?</li><li>Am I leaving anything undefended?</li></ol></div><button class="secondary-button" disabled={!moves.length || phase !== 'ready'} onclick={() => void buildReport()}>Pause & find the turning points <ArrowUpRight size={15}/></button><p class="option-help">A hint is still here if you need one. No rating to protect.</p>
            {:else}
              <div class="coach-message"><span class="speech-marker" aria-hidden="true">“</span><h3>{moves.length === 0 ? 'You don’t have to be good to play here.' : game.isCheck() ? 'First things first. Protect your king.' : 'Pause. Look. Make your move.'}</h3><p>{moves.length === 0 ? activeLesson.tip : 'Look for checks, captures, and threats. Then pick the idea you want to try.'}</p></div>
              <div class="options-heading"><h3>A FEW GOOD IDEAS</h3><span>{phase === 'ready' ? 'PICK ONE TO EXPLORE' : 'CHECKING THE POSITION'}</span></div>
              {#if phase !== 'ready'}
                <div class="thinking-state"><span class="thinking-pawn"><Piece type="n" color="w" /></span><p>Looking a few moves ahead…<small>The engine runs right here in your browser.</small></p></div>
              {:else}
                <div class="move-options">
                  {#each lines as line, i}
                    {@const move = moveFromLine(game.fen(), line)}
                    {@const explanation = describeMove(game.fen(), line.move)}
                    <button class="move-option" class:chosen={option === i} onclick={() => preview(i)} aria-pressed={option === i}><span class="option-notation">{move.san}</span><span class="option-copy"><strong>{explanation.title}</strong><span>{pieceNames[move.piece]} {move.from} → {move.to}</span></span>{#if i === 0}<span class="best-label">TOP PICK</span>{:else}<ChevronRight size={17}/>{/if}</button>
                  {/each}
                </div>
                {#if option !== null && lines[option]}
                  <div class="option-detail"><p>{describeMove(game.fen(), lines[option].move).detail}</p><div class="variation"><span>ONE POSSIBLE LINE</span><strong>{lineToSan(game.fen(), lines[option].pv).join(' → ')}</strong></div><button class="primary-button" onclick={playOption}>Play {moveFromLine(game.fen(), lines[option]).san} <ArrowRight size={17}/></button></div>
                {:else}<p class="option-help">Tap an idea to see it on the board.<br />Or trust your gut. We’ll work through it.</p>{/if}
              {/if}
            {/if}
          </div>
          {#if (phase === 'ready' || phase === 'review') && !openingReview}
            <div class="coach-questions"><span>LET’S TALK CHESS</span><div><button onclick={() => ask('What is the threat?')}>What’s the threat? <ArrowUpRight size={13}/></button><button onclick={() => ask('Explain this position')}>Explain the position <ArrowUpRight size={13}/></button></div>
              {#if answer}<div class="coach-answer" role="status"><div><strong>{lastQuestion}</strong><button aria-label="Close coach answer" onclick={() => answer = ''}><X size={14}/></button></div><p>{answer}</p></div>{/if}
              <form onsubmit={(event) => { event.preventDefault(); ask(query); }}><label class="sr-only" for="coach-question">Ask the local coach about moves, threats, or castling</label><input id="coach-question" bind:value={query} maxlength="240" placeholder="Ask about moves, threats, castling…"/><button aria-label="Ask coach" disabled={!query.trim()}><Send size={16}/></button></form>
            </div>
          {/if}
          <div class="coach-footnote"><span class="live-dot"></span> {recommendation?.source === 'jev' ? 'JEV + STOCKFISH' : 'LOCAL COACH'} <span>Evidence first. One lesson at a time.</span></div>
        </aside>
      </div>
      <div class="below-board"><span class="club-rule">CLUB RULE #1</span><p>A blunder is only wasted if you learn nothing from it.</p><span>{played} moves explored <i>/</i> {retries} second {retries === 1 ? 'chance' : 'chances'}</span></div>
    {:else if view === 'practice'}
      <section class="library"><div class="library-heading"><h1>LESS THEORY.<br /><span>MORE TRYING.</span></h1><p>Your learning is a network, not a checklist.<br />Follow the idea your last game brought up.</p></div><SkillMap counts={skillCounts} {practiced} onStart={startById}/><div class="opening-feature"><div><span>START WITH A PLAN</span><h2>The Italian Game.</h2><p>Learn the center. Develop with purpose. Castle.<br />Then try the same opening without the prompts.</p></div><button class="primary-button" onclick={() => start(italian)}>Learn this opening <ArrowRight size={18}/></button></div><div class="practice-list">{#each lessons as lesson, i}<button class="practice-row" onclick={() => start(lesson)}><span class="practice-index">{String(i + 1).padStart(2, '0')}</span><span class="practice-title"><strong>{lesson.title}</strong><span>{lesson.detail}</span></span><span class="practice-focus">{lesson.focus}</span><ArrowUpRight size={25}/></button>{/each}</div><p class="library-note">Starting a board replaces your current game. Your saved lessons stay with you.</p></section>
    {:else}
      <section class="library"><div class="library-heading"><h1>YOUR MISTAKES.<br /><span>YOUR PLAYBOOK.</span></h1><p>The moves you stopped to understand.<br />{account ? 'Your account keeps these lessons ready for another look.' : 'Saved in this browser. Sign in to take them with you.'}</p></div>
        {#if saved.length}<div class="saved-list">{#each saved as lesson}<article class="saved-lesson"><div class="saved-notation"><span>{lesson.move}</span><ArrowRight size={20}/><strong>{lesson.best}</strong></div><span class="saved-pattern">{lesson.pattern || 'A move worth revisiting'}</span><p>{lesson.text}</p><button class="primary-button" onclick={() => practiceSaved(lesson)}>Play this position again <RotateCcw size={16}/></button><div class="saved-meta"><span>{lesson.count && lesson.count > 1 ? `${lesson.count} encounters · ` : ''}{new Date(lesson.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><button class="text-button" onclick={() => { removedLessons = {...removedLessons,[lesson.id]:Date.now()}; saved = saved.filter(l => l.id !== lesson.id); persist(); }}>Remove <X size={14}/></button></div></article>{/each}</div>
        {:else}<div class="empty-journal"><BookOpen size={44} strokeWidth={1.2}/><h2>Nothing to unlearn. Yet.</h2><p>When the coach catches a mistake, choose “Keep this lesson.”<br />Your own chess playbook starts there.</p><button class="primary-button" onclick={() => view = 'play'}>Back to the board <ArrowRight size={17}/></button></div>{/if}
      </section>
    {/if}
    {#if notification}<div class="notification" role="status">{notification}<button aria-label="Dismiss notification" onclick={() => notification = ''}><X size={16}/></button></div>{/if}
  </main>
  <footer><a href="/engine/SOURCE-AND-NOTICES.txt" target="_blank" rel="noreferrer">Engine source & licenses <ArrowUpRight size={12}/></a><span>BLUNDER SCHOOL<span class="brand-period">.</span> <span>A LITTLE BETTER, EVERY GAME.</span></span><a href="https://github.com/mager/blunder-club" target="_blank" rel="noreferrer">Made for the learning curve <ArrowUpRight size={13}/></a></footer>
</div>
