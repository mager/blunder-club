<script lang="ts">
  import type { PieceSymbol, Color } from 'chess.js';
  let { type, color, small = false }: { type: PieceSymbol; color: Color; small?: boolean } = $props();
</script>
<svg class:small class="chess-piece" class:white={color === 'w'} viewBox="0 0 48 48" aria-hidden="true">
  <g fill="currentColor" stroke="var(--piece-outline)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    {#if type === 'p'}
      <circle cx="24" cy="12" r="6.5"/>
      <path d="M19 19h10c-2 6-1 10 4 15H15c5-5 6-9 4-15Z"/>
      <path d="M15 34h18l3 5v3H12v-3Z"/>
      <path d="M16 38h16" stroke="var(--piece-detail)"/>
    {:else if type === 'r'}
      <path d="M11 7h7v6h4V7h4v6h4V7h7v13l-6 4v10l5 5v3H12v-3l5-5V24l-6-4Z"/>
      <path d="M13 20h22M17 25h14M16 34h16M16 38h16" fill="none" stroke="var(--piece-detail)"/>
    {:else if type === 'n'}
      <path d="m18 10 1-6 7 5c10 1 13 11 11 26H14c0-6 3-10 9-15l-8 4-6-4 9-10Z"/>
      <path d="M26 13c7 4 7 11 6 16" fill="none" stroke="var(--piece-detail)"/>
      <circle cx="21.5" cy="14.5" r="1.6" fill="var(--piece-detail)" stroke="none"/>
      <path d="M14 35h23l2 4v3H10v-3Z"/><path d="M15 38.5h19" stroke="var(--piece-detail)"/>
    {:else if type === 'b'}
      <circle cx="24" cy="6" r="2.5"/>
      <path d="M24 9c-4 4-10 9-10 14 0 4 4 6 10 6s10-2 10-6c0-5-6-10-10-14Z"/>
      <path d="m26 13-6 8" fill="none" stroke="var(--piece-detail)" stroke-width="2.5"/>
      <path d="M19 29h10l2 6H17ZM14 35h20l4 5v2H10v-2Z"/>
      <path d="M16 38.5h16" stroke="var(--piece-detail)"/>
    {:else if type === 'q'}
      <path d="m9 14 6 17h18l6-17-9 8-6-12-6 12Z"/>
      <circle cx="9" cy="11" r="2.7"/><circle cx="24" cy="7" r="2.7"/><circle cx="39" cy="11" r="2.7"/>
      <path d="M16 31h16v4H16ZM14 35h20l4 5v2H10v-2Z"/>
      <path d="M17 28h14M16 38.5h16" stroke="var(--piece-detail)"/>
    {:else}
      <path d="M22 3h4v4h4v4h-4v5h-4v-5h-4V7h4Z"/>
      <path d="M15 16c3-3 6-2 9 1 3-3 6-4 9-1 5 5 0 10-3 15H18c-3-5-8-10-3-15Z"/>
      <path d="M18 31h12l2 4H16ZM14 35h20l4 5v2H10v-2Z"/>
      <path d="M24 19v8M16 38.5h16" fill="none" stroke="var(--piece-detail)"/>
    {/if}
  </g>
</svg>
