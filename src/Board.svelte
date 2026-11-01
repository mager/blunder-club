<script lang="ts">
  import { tick } from 'svelte';
  import type { Chess, Square, PieceSymbol, Move } from 'chess.js';
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
  function point(square: string) {
    const file = files.indexOf(square[0]); const rank = Number(square[1]);
    return { x: (flipped ? 7 - file : file) * 10 + 5, y: (flipped ? rank - 1 : 8 - rank) * 10 + 5 };
  }
  let arrow = $derived(hint ? { from: point(hint.slice(0,2)), to: point(hint.slice(2,4)) } : null);
  let priorFen = '';
  let priorMove: Move | undefined;
  let priorFlip = false;
  let motionVersion = 0;
  // Animate only an adjacent legal move, including its rook when castling.
  // Loading a game, jumping to a position, and flipping stay immediate.
  $effect.pre(() => {
    const fen = game.fen(); const flip = flipped;
    const latest = game.history({verbose:true}).at(-1);
    const forward = latest && priorFen === latest.before;
    const backward = priorMove && fen === priorMove.before && priorFen === priorMove.after;
    const move = forward ? latest : backward ? priorMove : undefined;
    const shouldMove = move && flip === priorFlip;
    priorFen = fen; priorMove = latest; priorFlip = flip;
    const version = ++motionVersion;
    if (!shouldMove || !move) return;
    const pairs = [{from:move.from,to:move.to}];
    if (move.isKingsideCastle()) pairs.push({from:`h${move.from[1]}` as Square,to:`f${move.from[1]}` as Square});
    if (move.isQueensideCastle()) pairs.push({from:`a${move.from[1]}` as Square,to:`d${move.from[1]}` as Square});
    void tick().then(() => {
      if (version !== motionVersion || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      for (const pair of pairs) {
        const from = backward ? pair.to : pair.from; const to = backward ? pair.from : pair.to;
        const square = document.getElementById(`square-${to}`);
        const piece = square?.querySelector<SVGElement>('.chess-piece');
        if (!square || !piece?.animate) continue;
        const a = point(from); const b = point(to); const size = square.getBoundingClientRect().width;
        square.style.zIndex = '3';
        const animation = piece.animate([{transform:`translate(${(a.x-b.x)/10*size}px, ${(a.y-b.y)/10*size}px)`},{transform:'translate(0, 0)'}],{duration:240,easing:'cubic-bezier(0.16, 1, 0.3, 1)'});
        animation.onfinish = animation.oncancel = () => {square.style.zIndex = '';};
      }
    });
  });
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
  {#if arrow}<svg class="board-arrows" viewBox="0 0 80 80" aria-hidden="true"><defs><marker id="hint-arrowhead" markerWidth="5" markerHeight="5" refX="3.7" refY="2.5" orient="auto"><path d="M0 0 L4.5 2.5 L0 5 Z" fill="var(--board-arrow)"/></marker></defs><line class="hint-arrow" x1={arrow.from.x} y1={arrow.from.y} x2={arrow.to.x} y2={arrow.to.y} marker-end="url(#hint-arrowhead)"/></svg>{/if}
</div>
