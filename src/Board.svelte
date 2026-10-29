<script lang="ts">
  import type { Chess, Square, PieceSymbol } from 'chess.js';
  import Piece from './Piece.svelte';
  import { squareName } from './chess';
  let { game, selected, destinations, lastMove, hint, flipped, disabled, onSquare }: {
    game: Chess; selected: Square | null; destinations: Square[]; lastMove: { from: string; to: string } | null;
    hint: string | null; flipped: boolean; disabled: boolean; onSquare: (square: Square) => void;
  } = $props();
  let focusSquare = $state<Square>('e2');
  const files = 'abcdefgh';
  let squares = $derived(Array.from({ length: 64 }, (_, i) => `${files[flipped ? 7 - i % 8 : i % 8]}${flipped ? Math.floor(i / 8) + 1 : 8 - Math.floor(i / 8)}` as Square));
  let checkSquare = $derived(game.isCheck() ? game.board().flat().find(p => p?.type === 'k' && p.color === game.turn())?.square : null);
  function key(event: KeyboardEvent, index: number) {
    const delta: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8 };
    if (event.key in delta) {
      event.preventDefault();
      const row = Math.floor(index / 8);
      const next = event.key === 'ArrowRight' || event.key === 'ArrowLeft'
        ? Math.max(row * 8, Math.min(row * 8 + 7, index + delta[event.key]))
        : Math.max(0, Math.min(63, index + delta[event.key]));
      focusSquare = squares[next];
      document.getElementById(`square-${focusSquare}`)?.focus();
    }
    if (event.key === 'Escape' && selected) { event.preventDefault(); onSquare(selected); }
  }
</script>
<div class="board-shell">
  <div class="chessboard" role="group" aria-label="Chessboard. Use arrow keys to move, Enter to select a piece and its destination.">
    {#each squares as square, i}
      {@const piece = game.get(square)}
      {@const target = destinations.includes(square)}
      <button id={`square-${square}`} class="square" class:light={(files.indexOf(square[0]) + Number(square[1])) % 2 === 0}
        class:selected={selected === square} class:last={lastMove?.from === square || lastMove?.to === square}
        class:hinted={hint?.slice(0, 2) === square || hint?.slice(2, 4) === square}
        class:check={checkSquare === square} class:target class:capture={target && !!piece}
        aria-label={`${squareName(square, game)}${target ? ', legal destination' : ''}${checkSquare === square ? ', in check' : ''}`}
        aria-pressed={selected === square} aria-disabled={disabled}
        tabindex={focusSquare === square ? 0 : -1}
        onclick={() => { focusSquare = square; onSquare(square); }} onkeydown={event => key(event, i)}>
        {#if i % 8 === 0}<span class="rank-label">{square[1]}</span>{/if}
        {#if i >= 56}<span class="file-label">{square[0]}</span>{/if}
        {#if piece}<Piece type={piece.type as PieceSymbol} color={piece.color} />{/if}
        {#if target && !piece}<span class="move-dot"></span>{/if}
      </button>
    {/each}
  </div>
</div>
