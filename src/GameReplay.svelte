<script lang="ts">
  import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from '@lucide/svelte';
  import type { Color } from 'chess.js';
  import Board from './Board.svelte';
  import { forcedResult, replayGame, type GameDraft } from './imported-games';
  import { fitBoard } from './fit-board';
  let { game, side, title, ply, onPly, back }: { game: GameDraft; side: Color; title: string; ply?: number; onPly: (ply: number) => void; back: string } = $props();
  let flipped = $state(false);
  $effect(() => { flipped = side === 'b'; });
  let index = $derived(ply ?? game.moves.length);
  let valid = $derived(index >= 0 && index <= game.moves.length);
  let full = $derived(replayGame(game).history({ verbose: true }));
  let board = $derived(replayGame(game, valid ? index : 0));
  let lastMove = $derived(index && valid ? full[index - 1] : null);
  function moveKeys(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); onPly(Math.max(0, index - 1)); }
    if (event.key === 'ArrowRight') { event.preventDefault(); onPly(Math.min(full.length, index + 1)); }
    if (event.key === 'Home') { event.preventDefault(); onPly(0); }
    if (event.key === 'End') { event.preventDefault(); onPly(full.length); }
  }
</script>

{#if !valid}
  <main class="library-page"><h1>That move is not in this game.</h1><a href={back}>Back to games</a></main>
{:else}
  <main class="game-stage replay-stage" use:fitBoard>
    <section class="board-column" aria-label="Game replay">
      <div class="player-strip"><span>{flipped ? game.white : game.black}</span><span>{game.result}</span></div>
      <div class="board-wrap"><Board game={board} selected={null} destinations={[]} {lastMove} hint={null} {flipped} disabled={true} onSquare={() => {}}/></div>
      <div class="player-strip"><span>{flipped ? game.black : game.white}</span><span>{index} / {full.length}</span></div>
      <div class="replay-controls" role="toolbar" tabindex="0" aria-label="Replay moves" onkeydown={moveKeys}>
        <button aria-label="First move" disabled={index === 0} onclick={() => onPly(0)}><ChevronsLeft size={20}/></button>
        <button aria-label="Previous move" disabled={index === 0} onclick={() => onPly(index - 1)}><ChevronLeft size={22}/></button>
        <label class="replay-select"><span class="sr-only">Selected move</span><select aria-label="Selected move" value={index} onchange={event => onPly(Number(event.currentTarget.value))}><option value={0}>Start</option>{#each full as move, i}<option value={i + 1}>{move.before.split(' ')[5]}{move.color === 'w' ? '.' : '…'} {move.san}</option>{/each}</select></label>
        <button aria-label="Next move" disabled={index === full.length} onclick={() => onPly(index + 1)}><ChevronRight size={22}/></button>
        <button aria-label="Last move" disabled={index === full.length} onclick={() => onPly(full.length)}><ChevronsRight size={20}/></button>
      </div>
    </section>
    <aside class="coach-dock replay-guide">
      <h1>{title}</h1>
      <p class="replay-position" aria-live="polite">{board.isCheckmate() ? `${lastMove?.san} · Checkmate` : forcedResult(board) === '1/2-1/2' ? 'Drawn position' : index === 0 ? 'Starting position' : `${lastMove?.san}${board.isCheck() ? ' · Check' : ''}`}</p>
      <p class="library-muted">Played as {side === 'w' ? 'White' : 'Black'} · {game.result}</p>
      <div class="library-actions"><button class="text-button" onclick={() => flipped = !flipped}><RefreshCw size={16}/> Flip board</button><a href={back}><ArrowLeft size={16}/> Back to games</a></div>
    </aside>
  </main>
{/if}

<style>
  .replay-stage { grid-template-columns: max(var(--board-size), 280px) 260px; }
  .board-column { width: max(var(--board-size), 280px); display: flex; flex-direction: column; align-items: center; }
  .board-wrap, .player-strip { width: var(--board-size); }
  .replay-guide h1 { font-size: 26px; line-height: 1.2; overflow-wrap: anywhere; }
  .replay-position { font-size: 20px; color: var(--acid); margin: 12px 0 6px; }
  .replay-controls { display: flex; width: 100%; align-items: center; justify-content: center; gap: 4px; }
  .replay-controls > button { min-width: 40px; min-height: 44px; display: grid; place-items: center; border-radius: 5px; }
  .replay-controls > button:hover:not(:disabled) { background: var(--raised); }
  .replay-select { flex: 1; max-width: 150px; min-width: 0; }
  .replay-select select { width: 100%; min-height: 44px; padding: 4px; background: var(--surface); color: var(--paper); border: 1px solid var(--line); border-radius: 5px; font: inherit; }
  .player-strip span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .replay-guide a { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; }
  @media (max-width: 760px), (max-height: 540px) { .replay-guide h1 { font-size: 18px; } .replay-position { font-size: 16px; margin: 5px 0; } .replay-guide .library-muted { font-size: 12px; } .replay-guide .library-actions { margin-top: 0; } }
  @media (min-width: 640px) and (max-height: 540px) { .replay-stage { grid-template-columns: max(var(--board-size), 280px) 240px; } }
</style>
