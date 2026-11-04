<script lang="ts">
  import MiniBoard from './MiniBoard.svelte';
  import { ArrowRight } from '@lucide/svelte';
  import { publicGameDraft, type PublicProfile, type PublicGame } from './profile';
  let { profile, onOpen }: { profile: PublicProfile; onOpen: (game: PublicGame, finish: boolean) => void } = $props();
</script>
<div class="profile-gallery">
  <h1>{profile.name}</h1>
  <p class="library-muted">Favorite games</p>
  {#if !profile.games.length}<p class="library-empty-copy">No featured games at this time.</p>{/if}
  {#each profile.games as game (game.id)}
    <article class="library-game-row">
      <button class="board-preview-button" aria-label={`Open finish: ${game.title}`} onclick={() => onOpen(game, true)}><MiniBoard game={publicGameDraft(game)} flipped={game.side === 'b'}/></button>
      <div class="library-game-copy">
        <h2>{game.title}</h2>
        <p>{game.white} <span class="library-muted">vs</span> {game.black}</p>
        <p class="library-muted">{game.result} · Played as {game.side === 'w' ? 'White' : 'Black'}</p>
        <div class="library-actions"><button class="text-button" onclick={() => onOpen(game, true)}>Open finish <ArrowRight size={16}/></button><button class="text-button" onclick={() => onOpen(game, false)}>Replay</button></div>
      </div>
    </article>
  {/each}
</div>
