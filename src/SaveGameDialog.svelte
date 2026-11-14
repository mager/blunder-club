<script lang="ts">
  import { Bookmark, X } from '@lucide/svelte';
  import type { GameDraft, ImportedGame } from './imported-games';
  import { message, type LibraryState } from './library-store';

  let { draft, draftError, libraryState, signedIn, show, onSave, onClose, onOpenLibrary }: {
    draft: GameDraft | null;
    draftError: string;
    libraryState: LibraryState;
    signedIn: boolean;
    show: (node: HTMLDialogElement) => { destroy: () => void };
    onSave: (favorite: boolean) => Promise<ImportedGame>;
    onClose: () => void;
    onOpenLibrary: () => void;
  } = $props();

  const resultLabels = { '*': 'In progress', '1-0': 'White won', '0-1': 'Black won', '1/2-1/2': 'Draw' };
  let favorite = $state(false);
  let busy = $state(false);
  let saveError = $state('');
  let savedId = $state('');
  let entry = $derived(libraryState.entries.find(row => row.game.id === savedId));
  let status = $derived(!signedIn ? 'Game saved on this device.'
    : entry?.conflict ? 'Game saved on this device. Open My games to resolve the sync conflict.'
    : entry && !entry.pending ? 'Game saved to your account.'
    : 'Game saved on this device. Cloud save pending.');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy || !draft || libraryState.loading || savedId) return;
    busy = true;
    saveError = '';
    try { savedId = (await onSave(favorite)).id; }
    catch (error) { saveError = message(error); }
    finally { busy = false; }
  }
</script>

<dialog class="game-dialog" use:show oncancel={onClose} aria-labelledby="save-game-heading">
  <div class="dialog-header">
    <h2 id="save-game-heading">Save game</h2>
    <button class="icon-button" aria-label="Close save game" onclick={onClose}><X size={22}/></button>
  </div>
  <form class="dialog-body" onsubmit={submit}>
    {#if draft}
      <p class="game-players">{draft.white} – {draft.black}</p>
      <p class="game-details">{draft.moves.length} {draft.moves.length === 1 ? 'half-move' : 'half-moves'} · {resultLabels[draft.result]}</p>
    {/if}
    {#if savedId}
      <p class="save-status" role="status">{status}</p>
      {#if signedIn && entry?.pending && !entry.conflict && libraryState.error}
        <p class="save-error" role="alert">{libraryState.error}</p>
      {/if}
      <button type="button" class="primary-button" onclick={onOpenLibrary}>View my games</button>
    {:else if draft}
      <p class="privacy">Keep a private copy in My games.</p>
      <label class="favorite"><input type="checkbox" bind:checked={favorite} disabled={busy}/>Add to favorites</label>
      {#if saveError || libraryState.error}<p class="save-error" role="alert">{saveError || libraryState.error}</p>{/if}
      <button type="submit" class="primary-button" disabled={busy || libraryState.loading}>
        {busy ? 'Saving…' : libraryState.loading ? 'Opening My games…' : 'Save game'} <Bookmark size={17}/>
      </button>
    {:else}
      <p class="save-error" role="alert">{draftError}</p>
    {/if}
  </form>
</dialog>

<style>
  .icon-button { width: 44px; height: 44px; }
  .dialog-body > p { margin: 0; overflow-wrap: anywhere; }
  .dialog-body > .game-players { font-size: 16px; font-weight: 600; }
  .game-details, .privacy { color: var(--muted); }
  .dialog-body > .privacy, .dialog-body > .save-status, .dialog-body > .save-error { margin-top: 12px; }
  .favorite { display: flex; align-items: center; gap: 10px; min-height: 44px; font-size: 14px; }
  .favorite input { width: 18px; height: 18px; margin: 0; accent-color: var(--acid); }
  .dialog-body > .primary-button { margin: 8px 0 0; }
  .save-status { color: var(--acid); }
  .save-error { color: var(--warning); }
</style>
