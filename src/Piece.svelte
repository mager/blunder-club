<script lang="ts">
  import type { PieceSymbol, Color } from 'chess.js';
  let { type, color, small = false }: { type: PieceSymbol; color: Color; small?: boolean } = $props();
</script>
<svg class:small class="chess-piece" class:white={color === 'w'} viewBox="0 0 48 48" aria-hidden="true">
  <g fill="currentColor" stroke="var(--piece-outline)" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
    {#if type === 'p'}
      <circle cx="24" cy="13" r="6"/><path d="M19 20h10l-1 10 6 6H14l6-6z"/><path d="M14 36h20l2 5H12z"/>
    {:else if type === 'r'}
      <path d="M12 8h6v6h4V8h4v6h4V8h6v12l-5 4v10l4 4H13l4-4V24l-5-4z"/><path d="M12 38h24v4H12zM17 24h14M17 34h14"/>
    {:else if type === 'n'}
      <path d="M13 36c0-8 4-13 11-17l-7 4-7-4 8-11 9-2 8 9 2 21z"/><path d="m18 8 1-5 5 4M13 36h24l2 6H10z"/><circle cx="24" cy="13" r="1.7" fill="var(--piece-outline)" stroke="none"/><path d="m29 17 4 13" fill="none"/>
    {:else if type === 'b'}
      <circle cx="24" cy="6" r="3"/><path d="M24 9c-9 7-12 13-5 19l-3 7h16l-3-7c7-6 4-12-5-19z"/><path d="m26 14-5 7M18 29h12M13 36h22l3 6H10z"/>
    {:else if type === 'q'}
      <path d="m12 15 5 17h14l5-17-8 7-4-12-4 12zM16 32h16v4H16zM13 36h22l3 6H10z"/><circle cx="11" cy="12" r="3"/><circle cx="24" cy="7" r="3"/><circle cx="37" cy="12" r="3"/>
    {:else}
      <path d="M24 4v9M20 8h8" fill="none" stroke-width="3"/><path d="M24 29c-18-6-14-21-4-16l4 5 4-5c10-5 14 10-4 16zM18 29h12l3 7H15zM13 36h22l3 6H10z"/>
    {/if}
  </g>
</svg>
