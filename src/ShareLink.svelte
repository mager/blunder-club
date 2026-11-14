<script lang="ts">
  import { Check, Link } from '@lucide/svelte';
  let { href, label = 'Copy link' }: { href: string; label?: string } = $props();
  let copied = $state(false);
  let fallback = $state('');
  let busy = $state(false);
  let generation = 0;
  $effect(() => { href; generation++; copied = false; fallback = ''; busy = false; });
  async function copy() {
    const url = new URL(href, location.href).href;
    const epoch = generation;
    busy = true; copied = false; fallback = '';
    try { await navigator.clipboard.writeText(url); if (epoch === generation) copied = true; }
    catch { if (epoch === generation) fallback = url; }
    finally { if (epoch === generation) busy = false; }
  }
</script>

<div class="share-link">
  <button class="text-button" disabled={busy} onclick={copy}>{#if copied}<Check size={16}/>{:else}<Link size={16}/>{/if}{label}</button>
  {#if copied}<span class="share-status" role="status">Link copied.</span>{/if}
  {#if fallback}<div class="share-fallback"><p role="status">Select and copy this link.</p><label class="library-field">Share link<input readonly value={fallback} onfocus={event => event.currentTarget.select()}/></label></div>{/if}
</div>
