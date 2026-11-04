<script lang="ts">
  import Piece from './Piece.svelte';
  import { replayGame, type GameDraft } from './imported-games';
  let { game, flipped = false }: { game: Pick<GameDraft, 'fen' | 'moves'>; flipped?: boolean } = $props();
  let board = $derived(replayGame(game).board().flat());
  let squares = $derived(flipped ? [...board].reverse() : board);
</script>
<div class="mini-board" aria-hidden="true">
  {#each squares as piece, i}<div class:light={(Math.floor(i / 8) + i % 8) % 2 === 0}>{#if piece}<Piece type={piece.type} color={piece.color}/>{/if}</div>{/each}
</div>

<style>
  .mini-board { width: 128px; aspect-ratio: 1; display: grid; grid-template-columns: repeat(8, 1fr); border-radius: 3px; overflow: hidden; }
  .mini-board > div { display: grid; place-items: center; background: var(--board-dark); aspect-ratio: 1; }
  .mini-board > div.light { background: var(--board-light); }
  @media (max-width: 500px) { .mini-board { width: 88px; } }
</style>
