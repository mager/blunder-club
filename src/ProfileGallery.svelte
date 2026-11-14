<script lang="ts">
  import MiniBoard from './MiniBoard.svelte';
  import Piece from './Piece.svelte';
  import ShareLink from './ShareLink.svelte';
  import { ArrowRight } from '@lucide/svelte';
  import { publicGameDraft, type PublicProfile, type PublicGame } from './profile';
  import { libraryHash } from './library-routes';
  let { profile, onOpen, profileId }: { profile: PublicProfile; onOpen: (game: PublicGame, finish: boolean) => void; profileId?: string } = $props();
  let avatar = $derived(profile.details?.avatar || 'n');
  let avatarName = $derived(avatar === 'r' ? 'Rook' : avatar === 'q' ? 'Queen' : 'Knight');
  let spotlight = $derived(profile.games.find(game => game.id === profile.details?.spotlight) || profile.games[0]);
  let collection = $derived(profile.games.filter(game => game.id !== spotlight?.id));
  function finishLink(game: PublicGame) { return libraryHash({ kind: 'public-game', profileId: profileId!, gameId: game.id, ply: game.moves.split(' ').length }); }
</script>

<div class="profile-gallery">
  <div class="profile-identity">
    <span class="profile-avatar" role="img" aria-label={`${avatarName} avatar`}><Piece type={avatar} color="w"/></span>
    <div class="profile-introduction"><h1>{profile.name}</h1>{#if profile.details?.bio}<p class="profile-bio">{profile.details.bio}</p>{/if}<p class="library-muted">{profile.games.length} {profile.games.length === 1 ? 'game' : 'games'} in this collection</p></div>
    {#if profileId}<ShareLink href={libraryHash({ kind: 'public-profile', profileId })} label="Copy profile link"/>{/if}
  </div>
  {#if spotlight}
    <article class="profile-spotlight">
      <button class="board-preview-button spotlight-board" aria-label={`Open finish: ${spotlight.title}`} onclick={() => onOpen(spotlight, true)}><MiniBoard game={publicGameDraft(spotlight)} flipped={spotlight.side === 'b'}/></button>
      <div class="spotlight-copy">
        <h2>{spotlight.title}</h2>
        <p class="spotlight-marker">Spotlight game</p>
        {#if profile.details?.stories[spotlight.id]}<p class="game-story">{profile.details.stories[spotlight.id]}</p>{/if}
        <p class="game-players">{spotlight.white} <span class="library-muted">vs</span> {spotlight.black}</p>
        <p class="library-muted">{spotlight.result} · Played as {spotlight.side === 'w' ? 'White' : 'Black'}</p>
        <div class="library-actions"><button class="primary-button" onclick={() => onOpen(spotlight, true)}>Open finish <ArrowRight size={16}/></button><button class="text-button" onclick={() => onOpen(spotlight, false)}>Replay</button></div>
        {#if profileId}<ShareLink href={finishLink(spotlight)} label="Copy game link"/>{/if}
      </div>
    </article>
  {:else}<p class="library-empty-copy">No featured games at this time.</p>{/if}
  {#if collection.length}<h2 class="profile-collection-title">More from this collection</h2>{/if}
  {#each collection as game (game.id)}
    <article class="library-game-row">
      <button class="board-preview-button" aria-label={`Open finish: ${game.title}`} onclick={() => onOpen(game, true)}><MiniBoard game={publicGameDraft(game)} flipped={game.side === 'b'}/></button>
      <div class="library-game-copy">
        <h2>{game.title}</h2>
        {#if profile.details?.stories[game.id]}<p class="game-story">{profile.details.stories[game.id]}</p>{/if}
        <p>{game.white} <span class="library-muted">vs</span> {game.black}</p>
        <p class="library-muted">{game.result} · Played as {game.side === 'w' ? 'White' : 'Black'}</p>
        <div class="library-actions"><button class="text-button" onclick={() => onOpen(game, true)}>Open finish <ArrowRight size={16}/></button><button class="text-button" onclick={() => onOpen(game, false)}>Replay</button></div>
        {#if profileId}<ShareLink href={finishLink(game)} label="Copy game link"/>{/if}
      </div>
    </article>
  {/each}
</div>
