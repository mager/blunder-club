<script lang="ts">
  import type { PieceSymbol, Color } from 'chess.js';
  let { type, color, small = false }: { type: PieceSymbol; color: Color; small?: boolean } = $props();
</script>
<svg class:small class="chess-piece" class:white={color === 'w'} viewBox="0 0 48 48" aria-hidden="true">
  <g fill="currentColor" stroke="var(--piece-outline)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    {#if type === 'p'}
      <circle cx="24" cy="15" r="6"/>
      <path d="M19 22h10c-3 5-2 10 3 14H16c5-4 6-9 3-14Z"/>
      <path d="M16 36h16l3 4v3H13v-3Z"/>
      <path d="M17 39h14" stroke="var(--piece-detail)"/>
    {:else if type === 'r'}
      <path d="M10 9h7v6h4V9h6v6h4V9h7v12l-6 4v10l5 5v3H11v-3l5-5V25l-6-4Z"/>
      <path d="M12 21h24M16 26h16M16 35h16M15 40h18" fill="none" stroke="var(--piece-detail)"/>
    {:else if type === 'n'}
      <path d="m17 13 2-7 8 5c9 2 13 11 11 26H15c0-7 4-12 10-17l-9 6-7-5 8-8Z"/>
      <path d="M28 16c5 4 6 10 5 15M15 21l3-1" fill="none" stroke="var(--piece-detail)"/>
      <circle cx="22" cy="16" r="1.7" fill="var(--piece-detail)" stroke="none"/>
      <path d="M14 37h24l2 3v3H10v-3Z"/><path d="M15 40h20" stroke="var(--piece-detail)"/>
    {:else if type === 'b'}
      <circle cx="24" cy="8" r="2.7"/>
      <path d="M24 11c-5 4-10 9-10 14 0 4 4 6 10 6s10-2 10-6c0-5-5-10-10-14Z"/>
      <path d="m27 16-6 8" fill="none" stroke="var(--piece-detail)" stroke-width="2.7"/>
      <path d="M20 31h8l3 6H17ZM15 37h18l5 4v2H10v-2Z"/>
      <path d="M16 40h16" stroke="var(--piece-detail)"/>
    {:else if type === 'q'}
      <path d="m10 14 6 17h16l6-17-9 8-5-12-5 12Z"/>
      <circle cx="10" cy="12" r="2.5"/><circle cx="24" cy="7" r="2.5"/><circle cx="38" cy="12" r="2.5"/>
      <path d="M16 31h16l-2 5H18ZM14 36h20l4 5v2H10v-2Z"/>
      <path d="M18 28h12M16 40h16" stroke="var(--piece-detail)"/>
    {:else}
      <!-- A broad cross and tall, full body keep the king distinct at small sizes. -->
      <path d="M21 2h6v5h6v6h-6v6h-6v-6h-6V7h6Z"/>
      <path d="M21 18c-4-5-12-2-12 4 0 5 5 8 8 11h14c3-3 8-6 8-11 0-6-8-9-12-4l-3 4Z"/>
      <path d="M17 32h14l2 5H15ZM13 37h22l5 5v3H8v-3Z"/>
      <path d="M24 23v6M16 41h16" fill="none" stroke="var(--piece-detail)"/>
    {/if}
  </g>
</svg>
