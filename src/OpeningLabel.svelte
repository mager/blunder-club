<script lang="ts">
  import { onMount } from 'svelte';
  import type { Chess } from 'chess.js';
  import { identifyOpening, loadOpeningIndex, type OpeningIndex } from './opening-name';

  let { game }: { game: Chess } = $props();
  let index = $state.raw<OpeningIndex | null>(null);
  let unavailable = $state(false);
  const name = $derived(index ? identifyOpening(game, index) : unavailable ? 'Name unavailable' : 'Finding the name…');
  onMount(() => {
    let active = true;
    loadOpeningIndex().then(data => { if (active) index = data; }).catch(() => { if (active) unavailable = true; });
    return () => { active = false; };
  });
</script>

<p class="opening-label" aria-live="polite" aria-atomic="true"><span>Opening</span> <strong>{name}</strong></p>

<style>
  .opening-label { margin: 0; padding: 5px 0 7px; font-size: 13px; line-height: 1.35; overflow-wrap: anywhere; }
  .opening-label span { color: var(--muted); margin-right: 6px; }
  .opening-label strong { color: var(--paper); font-weight: 500; }
  @media (max-width: 760px), (max-height: 540px) {
    .opening-label { font-size: 12px; padding: 2px 0 5px; }
  }
</style>
