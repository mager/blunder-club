<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
  import { ArrowLeft, ArrowRight, Bookmark, Check, Link, MoveUpRight, Plus, Star, Trash2, X } from '@lucide/svelte';
  import { cloudConfigured, cloudServices } from './firebase-client';
  import { CloudLibrary } from './library-cloud';
  import { GameLibrary, LibraryStore, message, type LibraryState } from './library-store';
  import { createImportedGame, editImportedGame, gameIdentity, parseGamePgn, type GameDraft, type ImportedGame } from './imported-games';
  import { libraryHash, type LibraryRoute } from './library-routes';
  import { playingStyle } from './playing-style';
  import { publicGameDraft, projectProfile, type ProfileOwnerState, type PublicProfile, type PublicGame, type ProfileDetails } from './profile';
  import { findStudy } from './curriculum';
  import MiniBoard from './MiniBoard.svelte';
  import GameReplay from './GameReplay.svelte';
  import ProfileGallery from './ProfileGallery.svelte';
  import Piece from './Piece.svelte';
  import './library.css';

  let { route }: { route: LibraryRoute } = $props();
  let services: ReturnType<typeof cloudServices> = null;
  let cloud = $state<CloudLibrary | null>(null);
  let library = $state<GameLibrary | null>(null);
  let account = $state<User | null>(null);
  let authReady = $state(false);
  let libraryState = $state<LibraryState>({ entries: [], loading: true, status: '', error: '' });
  let error = $state(''); let notice = $state(''); let busy = $state(false);
  let owner = $state<ProfileOwnerState>({ settings: null, profile: null });
  let ownerLoaded = $state(false);
  let published = $state<PublicProfile | null>(null);
  let publicLoading = $state(true); let publicError = $state('');
  let name = $state(''); let selected = $state<string[]>([]);
  let bio = $state(''); let avatar = $state<ProfileDetails['avatar']>('n');
  let spotlight = $state(''); let stories = $state<Record<string, string>>({});
  let preview = $state<PublicProfile | null>(null);
  let previewGames = $state<ImportedGame[]>([]); let previewRevision = $state(0);
  let importing = $state(false); let pgn = $state(''); let draft = $state<GameDraft | null>(null);
  let side = $state<'' | 'w' | 'b'>(''); let duplicate = $state<ImportedGame | null>(null); let importError = $state('');
  let editing = $state<ImportedGame | null>(null); let title = $state(''); let editSide = $state<'w' | 'b'>('w');
  let removing = $state<ImportedGame | null>(null);
  let generation = 0;
  let isPublic = $derived(route.kind === 'public-profile' || route.kind === 'public-game');
  let publicProfileId = $derived(route.kind === 'public-profile' || route.kind === 'public-game' ? route.profileId : null);
  let games = $derived(libraryState.entries.filter(row => !row.game.deleted).map(row => row.game).sort((a, b) => b.editedAt - a.editedAt));
  let favorites = $derived(games.filter(game => game.favorite));
  let shown = $derived(route.kind === 'owner' ? favorites : games);
  let style = $derived(playingStyle(games));
  let privateGame = $derived(route.kind === 'private-game' ? games.find(game => game.id === route.gameId) : undefined);
  let publicGame = $derived(route.kind === 'public-game' ? published?.games.find(game => game.id === route.gameId) : undefined);
  let returnHash = $state('#/play');
  try { const saved = sessionStorage.getItem('nextmove-return-game'); if (saved && /^#\/(play|learn|practice|position)(?:[/?]|$)/.test(saved)) returnHash = saved; } catch { /* Return to the saved board. */ }

  onMount(() => {
    services = cloudServices(); cloud = services ? new CloudLibrary(services.db) : null;
    const store = new LibraryStore();
    library = new GameLibrary(store, cloud, next => { libraryState = next; });
    const off = services ? onAuthStateChanged(services.auth, user => { generation++; account = user; authReady = true; busy = false; importing = false; editing = null; preview = null; removing = null; pgn = ''; draft = null; duplicate = null; error = ''; notice = ''; }) : () => {};
    if (!services) authReady = true;
    const online = () => { if (!isPublic) void retry(); };
    window.addEventListener('online', online);
    return () => { generation++; off(); library?.dispose(); window.removeEventListener('online', online); void store.close().catch(() => {}); };
  });

  $effect(() => {
    if (!authReady || !library) return;
    const uid = account?.uid || null;
    if (isPublic) { library.dispose(); libraryState = { entries: [], loading: true, status: '', error: '' }; return; }
    untrack(() => {
      name = ''; selected = []; bio = ''; avatar = 'n'; spotlight = ''; stories = {}; owner = { settings: null, profile: null }; ownerLoaded = !uid;
      void library!.selectAccount(uid).then(() => loadOwner(true));
    });
  });
  $effect(() => {
    const id = publicProfileId; const remote = cloud;
    publicError = ''; published = null; publicLoading = true;
    if (!id) return;
    if (!remote) { publicLoading = false; publicError = 'Public profiles are not available on this server.'; return; }
    let current = true;
    void remote.readPublic(id).then(value => { if (current) published = value; }).catch(e => { if (current) publicError = message(e); }).finally(() => { if (current) publicLoading = false; });
    return () => { current = false; };
  });

  async function loadOwner(resetDraft = false) {
    const uid = account?.uid; const epoch = generation;
    if (!uid || !cloud || isPublic) return;
    try {
      const result = await cloud.ownerState(uid);
      if (epoch !== generation || isPublic) return;
      owner = result;
      if (resetDraft) {
        name = result.profile?.name || '';
        bio = result.profile?.details?.bio || ''; avatar = result.profile?.details?.avatar || 'n';
        spotlight = result.profile?.details?.spotlight || ''; stories = { ...result.profile?.details?.stories };
        selected = games.filter(g => result.settings?.featured.includes(g.publicId)).map(g => g.id);
      }
      ownerLoaded = true;
    } catch (e) { if (epoch === generation) { error = message(e); ownerLoaded = false; } }
  }
  async function action(work: () => Promise<void>) {
    const epoch = generation; busy = true; error = ''; notice = '';
    try { await work(); } catch (e) { if (epoch === generation) error = message(e); }
    finally { if (epoch === generation) busy = false; }
  }
  async function login() { await action(async () => { if (services) await signInWithPopup(services.auth, new GoogleAuthProvider()); }); }
  async function logout() { await action(async () => { if (services) await signOut(services.auth); }); }
  async function retry() { await action(async () => { await library?.sync(); await loadOwner(); }); }
  function modal(node: HTMLDialogElement) {
    const prior = document.activeElement as HTMLElement | null; node.showModal();
    return { destroy() { node.close(); prior?.focus(); } };
  }
  function openImport() { importing = true; draft = null; duplicate = null; side = ''; importError = ''; }
  async function checkPgn() {
    const epoch = generation; busy = true; importError = '';
    try {
      const parsed = parseGamePgn(pgn); const id = await gameIdentity(parsed);
      if (epoch !== generation) return;
      draft = parsed; duplicate = libraryState.entries.find(row => row.game.id === id)?.game || null;
      side = duplicate?.side || '';
    } catch (e) { if (epoch === generation) importError = message(e); }
    finally { if (epoch === generation) busy = false; }
  }
  async function saveImport() {
    if (!draft || !side || !library) return;
    const epoch = generation; const chosen = side; const source = draft;
    busy = true; importError = '';
    try {
      const game = duplicate ? editImportedGame(duplicate, { side: chosen, deleted: false }) : await createImportedGame(source, chosen);
      if (epoch !== generation) return;
      await library.save(game, !!duplicate?.deleted);
      if (epoch !== generation) return;
      importing = false; pgn = ''; draft = null;
      notice = duplicate ? 'Your saved game is ready. It counts once.' : 'Game saved. Open the finish or replay it from the start.';
      void library.sync(); location.hash = '#/games';
    } catch (e) { if (epoch === generation) importError = message(e); }
    finally { if (epoch === generation) busy = false; }
  }
  async function changeGame(game: ImportedGame, edit: Parameters<typeof editImportedGame>[1]) {
    const epoch = generation;
    await action(async () => {
      await library?.save(editImportedGame(game, edit));
      if (epoch !== generation) return;
      editing = null; removing = null;
      await library?.sync(); await loadOwner();
    });
  }
  function privateLink(game: ImportedGame, finish: boolean) { return libraryHash({ kind: 'private-game', gameId: game.id, ply: finish ? game.moves.length : 0 }); }
  function openPublic(game: PublicGame, finish: boolean) {
    if (!publicProfileId) return;
    location.hash = libraryHash({ kind: 'public-game', profileId: publicProfileId, gameId: game.id, ply: finish ? game.moves.split(' ').length : 0 });
  }
  function makePreview() {
    try {
      const chosen = favorites.filter(g => selected.includes(g.id));
      if (libraryState.entries.some(row => selected.includes(row.game.id) && (row.pending || row.conflict))) throw new Error('Sync the selected games before publishing.');
      previewGames = chosen; previewRevision = owner.settings?.revision || 0;
      const details: ProfileDetails = { bio, avatar, spotlight: chosen.find(g => g.publicId === spotlight)?.publicId || chosen[0]?.publicId || null, stories: Object.fromEntries(chosen.filter(g => stories[g.publicId]?.trim()).map(g => [g.publicId, stories[g.publicId]])) };
      preview = projectProfile(name, chosen, previewRevision + 1, details); error = '';
    } catch (e) { error = message(e); }
  }
  async function publish() {
    const uid = account?.uid; const current = preview; const epoch = generation;
    if (!uid || !cloud || !current) return;
    await action(async () => {
      const result = await cloud!.publish(uid, current.name, previewGames, previewRevision, current.details);
      if (epoch !== generation) return;
      owner = result; preview = null; notice = 'Your public profile is ready. Copy its link to share it.';
    });
  }
  async function unpublish() {
    const uid = account?.uid; const revision = owner.settings?.revision; const epoch = generation;
    if (!uid || !cloud || revision === undefined) return;
    await action(async () => {
      const result = await cloud!.unpublish(uid, revision);
      if (epoch !== generation) return;
      owner = result; notice = 'Your profile is no longer public. Your games stay saved.';
    });
  }
  async function copyProfile() {
    if (!owner.settings?.published) return;
    const url = new URL(location.href); url.hash = `#/profile/${owner.settings.publicId}`;
    await action(async () => { try { await navigator.clipboard.writeText(url.href); notice = 'Public profile link copied.'; } catch { notice = `Copy this link: ${url.href}`; } });
  }
</script>

<svelte:head><title>{isPublic && published ? `${published.name} — Favorite games` : 'Your games'} · Nextmove</title></svelte:head>
<div class="app-shell library-shell">
  <header class="game-header library-header">
    <a class="wordmark" href={returnHash} aria-label="Nextmove home"><MoveUpRight size={24}/><span>nextmove</span></a>
    <nav aria-label="Game library"><a href="#/games" aria-current={route.kind === 'library' ? 'page' : undefined}>My games</a><a href="#/me" aria-current={route.kind === 'owner' ? 'page' : undefined}>Profile</a></nav>
    <a class="library-return" href={returnHash} aria-label="Back to game"><ArrowLeft size={17}/><span>Back to game</span></a>
  </header>

  {#if route.kind === 'invalid'}
    <main class="library-page"><h1>Link not available</h1><p>{route.error}</p><a href={returnHash}>Back to your game</a></main>
  {:else if isPublic}
    {#if publicLoading}<main class="library-page"><p role="status">Loading profile…</p></main>
    {:else if publicError || !published}<main class="library-page"><h1>Profile not available</h1><p>{publicError || 'This profile is not published.'}</p><a href={returnHash}>Back to your game</a></main>
    {:else if route.kind === 'public-game'}
      {#if publicGame}<GameReplay game={publicGameDraft(publicGame)} side={publicGame.side} title={publicGame.title} ply={route.ply} back={`#/profile/${route.profileId}`} onPly={ply => { if (route.kind === 'public-game') location.hash = libraryHash({ ...route, ply }); }}/>
      {:else}<main class="library-page"><h1>Game not available</h1><p>This game is no longer featured.</p><a href={`#/profile/${route.profileId}`}>Back to profile</a></main>{/if}
    {:else}<main class="library-page"><ProfileGallery profile={published} onOpen={openPublic} profileId={publicProfileId || undefined}/></main>{/if}
  {:else if !authReady || libraryState.loading}<main class="library-page"><p role="status">Loading your games…</p></main>
  {:else if route.kind === 'private-game'}
    {#if privateGame}<GameReplay game={privateGame} side={privateGame.side} title={privateGame.title} ply={route.ply} back="#/games" onPly={ply => { if (route.kind === 'private-game') location.hash = libraryHash({ ...route, ply }); }}/>
    {:else}<main class="library-page"><h1>Game not found here</h1><p>Open this link on the device where you saved it, or sign in to its account.</p>{#if !account && cloudConfigured}<button class="primary-button" disabled={busy} onclick={login}>Continue with Google</button>{/if}<a href="#/games">Back to my games</a></main>{/if}
  {:else}
    <main class="library-page">
      <div class="library-heading"><div><h1>{route.kind === 'owner' ? 'Your profile' : 'Your games'}</h1><p class="library-muted">{route.kind === 'owner' ? 'A little about you. The games you want to share.' : 'Bring a game. Keep the finish. Find your next lesson.'}</p></div><button class="primary-button" disabled={busy} onclick={openImport}><Plus size={18}/> Paste a game</button></div>
      {#if error || libraryState.error}<div class="library-error" role="alert"><p>{error || libraryState.error}</p><button class="text-button" disabled={busy} onclick={retry}>Retry cloud save</button></div>{/if}
      {#if notice}<p class="library-notice" role="status">{notice}</p>{/if}
      <div class="library-save"><span>{libraryState.status || 'Saved on this device'}</span>{#if account}<button class="text-button" disabled={busy} onclick={retry}>Sync games</button><button class="text-button" disabled={busy} onclick={logout}>Sign out</button>{:else if cloudConfigured}<button class="text-button" disabled={busy} onclick={login}>Sign in to save across devices <ArrowRight size={14}/></button>{/if}</div>
      {#each libraryState.entries.filter(row => row.conflict) as row}<section class="library-conflict"><h2>Choose a version: {row.game.title}</h2><p>Your edit is kept on this device. {row.conflict?.deleted ? 'This game was removed on another device.' : 'The account has a newer version.'}</p><div class="library-actions"><button class="secondary-button" disabled={busy} onclick={() => action(async () => { await library?.resolve(row.game.id, false); })}>Use account version</button>{#if !row.conflict?.deleted}<button class="secondary-button" disabled={busy} onclick={() => action(async () => { await library?.resolve(row.game.id, true); })}>Keep my local edit</button>{/if}</div></section>{/each}
      {#if route.kind === 'owner'}
        <section class="profile-sharing profile-editor" aria-labelledby="profile-edit-title">
          <h2 id="profile-edit-title">Make it yours</h2><p class="library-muted">Choose what people see. Your learning notes stay private.</p>
          {#if !account}<div class="profile-sign-in"><span class="profile-avatar" aria-hidden="true"><Piece type="n" color="w"/></span><div><h3>Your own corner of the board.</h3><p>A public name, a few words about you, and the games worth keeping.</p>{#if cloudConfigured}<button class="secondary-button" disabled={busy} onclick={login}>Continue with Google</button>{/if}<p class="library-muted">Your favorites stay on this device until you sign in.</p></div></div>
          {:else}
            <div class="profile-edit-identity">
              <fieldset class="profile-avatar-options" disabled={busy || !ownerLoaded}><legend>Your piece</legend>{#each [{ type: 'n', name: 'Knight' }, { type: 'r', name: 'Rook' }, { type: 'q', name: 'Queen' }] as piece}<label class:chosen={avatar === piece.type}><input type="radio" name="profile-avatar" value={piece.type} bind:group={avatar} aria-label={piece.name}/><span><Piece type={piece.type as ProfileDetails['avatar']} color="w"/></span><span>{piece.name}</span></label>{/each}</fieldset>
              <div class="profile-edit-copy"><label class="library-field">Public name<input disabled={busy || !ownerLoaded} maxlength={40} bind:value={name} placeholder="Choose a name" autocomplete="nickname"/></label><label class="library-field">About you<textarea disabled={busy || !ownerLoaded} maxlength={160} bind:value={bio} rows={2} placeholder="What brings you to the board?"></textarea></label><p class="profile-character-count">{bio.length}/160 · Optional</p></div>
            </div>
            <fieldset class="profile-picks"><legend>Choose up to 8 favorite games</legend>{#each favorites as game}<div class="profile-pick"><label><input type="checkbox" value={game.id} bind:group={selected} disabled={busy || !ownerLoaded || (!selected.includes(game.id) && selected.length >= 8)}/><span>{game.title}</span></label>{#if selected.includes(game.id)}<label class="library-field profile-story-field">Why I kept it<textarea aria-label={`Why I kept it: ${game.title}`} disabled={busy || !ownerLoaded} maxlength={160} rows={2} value={stories[game.publicId] || ''} oninput={event => { stories = { ...stories, [game.publicId]: event.currentTarget.value }; }} placeholder="A move, a lesson, or a finish worth remembering."></textarea></label>{/if}</div>{/each}{#if !favorites.length}<p class="library-muted">Mark a saved game as a favorite first. You can paste a game or save one from the board.</p>{/if}</fieldset>
            {#if selected.length}<label class="library-field">Spotlight game<select bind:value={spotlight} disabled={busy || !ownerLoaded} aria-label="Spotlight game"><option value="">First selected game</option>{#each favorites.filter(game => selected.includes(game.id)) as game}<option value={game.publicId}>{game.title}</option>{/each}</select><span class="library-muted">This game gets the main board on your profile.</span></label>{/if}
            <div class="profile-publish"><button class="primary-button" disabled={busy || !ownerLoaded || !selected.length} onclick={makePreview}>Preview public profile <ArrowRight size={16}/></button><span class="library-muted">Review it before it goes public.</span></div>
            {#if owner.settings?.published}<div class="library-actions"><button class="secondary-button" disabled={busy} onclick={copyProfile}><Link size={16}/> Copy public link</button><a href={`#/profile/${owner.settings.publicId}`}>View public profile</a><button class="text-button" disabled={busy} onclick={unpublish}>Unpublish profile</button></div><p class="library-muted">Edits stay private until you update the public profile. Removing a featured game removes its public copy when sync succeeds.</p>{/if}
          {/if}
        </section>
        <h2 class="private-favorites-heading">Your private favorites</h2>
      {/if}
      {#if !shown.length}<div class="library-empty"><Bookmark size={30}/><h2>{games.length ? 'Choose a game to keep here.' : 'Your next favorite starts here.'}</h2><p>{games.length ? 'Mark a saved game as a favorite. It stays private until you publish it.' : 'Paste a PGN from a chess site. Choose your side, then replay every move.'}</p>{#if games.length}<a href="#/games">Choose from my games <ArrowRight size={16}/></a>{:else}<p class="library-muted">Guest games stay on this device.</p>{/if}</div>{/if}
      {#each shown as game (game.id)}
        <article class="library-game-row">
          <a class="board-preview-button" href={privateLink(game, true)} aria-label={`Open finish: ${game.title}`}><MiniBoard {game} flipped={game.side === 'b'}/></a>
          <div class="library-game-copy"><h2>{game.title}</h2><p>{game.white} <span class="library-muted">vs</span> {game.black}</p><p class="library-muted">{game.result} · Played as {game.side === 'w' ? 'White' : 'Black'}</p>
            <div class="library-actions"><a href={privateLink(game, true)}>Open finish <ArrowRight size={15}/></a><a href={privateLink(game, false)}>Replay</a><button class="text-button" aria-label={`${game.favorite ? 'Remove favorite' : 'Favorite'}: ${game.title}`} aria-pressed={game.favorite} disabled={busy} onclick={() => changeGame(game, { favorite: !game.favorite })}><Star size={16} fill={game.favorite ? 'currentColor' : 'none'}/>{game.favorite ? 'Favorite' : 'Keep favorite'}</button></div>
            <div class="library-actions library-edit-actions"><button class="text-button" disabled={busy} onclick={() => { editing = game; title = game.title; editSide = game.side; }}>Edit title or side</button><button class="text-button" aria-label={`Remove game: ${game.title}`} disabled={busy} onclick={() => removing = game}><Trash2 size={14}/> Remove</button></div>
          </div>
        </article>
      {/each}
      {#if games.length}
        <details class="style-notes" open={route.kind === 'library'}><summary>Your style notes <span>{style.sample} {style.sample === 1 ? 'game' : 'games'} · Private</span></summary>
          <p>{style.checks} checking moves and {style.captures} captures across {style.moves} of your moves.</p><p class="library-muted">Move facts, not a strength rating. Checks include checkmate. {style.sample < 3 ? 'Add more games to compare your choices.' : ''}</p>
          {#each style.facts as fact}<a class="style-source" href={libraryHash({ kind: 'private-game', gameId: fact.id })}><strong>{fact.title}</strong><span>{fact.side === 'w' ? 'White' : 'Black'} · {fact.standard ? `First move ${fact.first || '—'}` : 'Custom start'} · {fact.checks}/{fact.moves} checking moves · {fact.captures}/{fact.moves} captures · {fact.castle ? `${fact.castle.san} on move ${fact.castle.move}` : 'No castling'}</span></a>{/each}
          {#if style.suggestion}<div class="style-suggestion"><p>{style.suggestion.reason}</p><a class="primary-button" href={style.suggestion.lesson === 'castle-short' ? '#/practice/castle-short' : `#/learn/${style.suggestion.lesson}`}>Try {findStudy(style.suggestion.lesson)?.title} <ArrowRight size={16}/></a></div>{/if}
        </details>
      {/if}

    </main>
  {/if}
</div>

{#if importing}
  <dialog class="game-dialog library-dialog" use:modal oncancel={() => importing = false} aria-labelledby="import-title"><div class="dialog-header"><h2 id="import-title">Paste a game</h2><button class="icon-button" aria-label="Close import" onclick={() => importing = false}><X size={22}/></button></div><div class="dialog-body">
    {#if !draft}<form onsubmit={event => { event.preventDefault(); void checkPgn(); }}><label class="library-field">PGN<textarea bind:value={pgn} rows={8} placeholder={'[White "You"]\n[Black "Opponent"]\n\n1. d4 d5 2. c4 …'} spellcheck={false} aria-describedby="pgn-help"></textarea></label><p id="pgn-help" class="library-muted">One standard-chess game · Up to 128 KiB. Your current game stays saved.</p>{#if importError}<p class="library-error" role="alert">{importError}</p>{/if}<button class="primary-button" disabled={busy} type="submit">{busy ? 'Checking game…' : 'Check game'} <ArrowRight size={17}/></button></form>
    {:else}<div class="import-preview"><MiniBoard game={draft}/><div><h3>{draft.white} vs {draft.black}</h3><p>{draft.result} · {draft.moves.length} half-moves</p><p class="library-muted">Legal moves checked</p></div></div>{#if duplicate}<p class="library-notice">{duplicate.deleted ? 'You removed this game before. Restore it to save it again.' : 'This game is already saved. It will count once.'}</p>{/if}<fieldset class="side-choice"><legend>Which side did you play?</legend><label><input type="radio" bind:group={side} value="w"/> White</label><label><input type="radio" bind:group={side} value="b"/> Black</label></fieldset>{#if importError}<p class="library-error" role="alert">{importError}</p>{/if}<button class="primary-button" disabled={!side || busy} onclick={saveImport}>{busy ? 'Saving…' : duplicate?.deleted ? 'Restore game' : duplicate ? 'Keep saved game' : 'Save game'} <Check size={17}/></button><button class="text-button" disabled={busy} onclick={() => { draft = null; duplicate = null; }}>Edit pasted PGN</button>{/if}
  </div></dialog>
{/if}
{#if editing}<dialog class="game-dialog library-dialog" use:modal oncancel={() => editing = null} aria-labelledby="edit-title"><div class="dialog-header"><h2 id="edit-title">Your game</h2><button class="icon-button" aria-label="Close edit" onclick={() => editing = null}><X size={22}/></button></div><form class="dialog-body" onsubmit={event => { event.preventDefault(); if (editing) void changeGame(editing, { title, side: editSide }); }}><label class="library-field">Game title<input maxlength={80} required bind:value={title}/></label><label class="library-field">Your side<select aria-label="Your side" bind:value={editSide}><option value="w">White</option><option value="b">Black</option></select></label>{#if error}<p class="library-error" role="alert">{error}</p>{/if}<button type="submit" class="primary-button" disabled={busy}>Save changes</button></form></dialog>{/if}
{#if removing}<dialog class="game-dialog library-dialog" use:modal oncancel={() => removing = null} aria-labelledby="remove-title"><div class="dialog-header"><h2 id="remove-title">Remove this game?</h2></div><div class="dialog-body"><p>{removing.title}</p><p class="library-muted">Its style evidence will be removed. If it is featured publicly, its public copy will be removed when cloud sync succeeds.</p><button class="primary-button" disabled={busy} onclick={() => { if (removing) void changeGame(removing, { deleted: true, favorite: false }); }}>Remove game</button><button class="secondary-button" disabled={busy} onclick={() => removing = null}>Keep game</button></div></dialog>{/if}
{#if preview}<dialog class="game-dialog wide library-dialog" use:modal oncancel={() => preview = null} aria-label="Public profile preview"><div class="dialog-header"><h2>Public profile preview</h2><button class="icon-button" aria-label="Close preview" onclick={() => preview = null}><X size={22}/></button></div><div class="dialog-body"><p class="library-muted">Anyone with the link can see this name, bio, chosen piece, game stories, titles, player names, results, sides, and moves.</p><ProfileGallery profile={preview} onOpen={game => { const source = previewGames.find(g => g.publicId === game.id); if (source) { preview = null; location.hash = privateLink(source, true); } }}/>{#if error}<p class="library-error" role="alert">{error}</p>{/if}<button class="primary-button" disabled={busy} onclick={publish}>{busy ? 'Publishing…' : owner.settings?.published ? 'Update public profile' : 'Publish profile'} <ArrowRight size={17}/></button></div></dialog>{/if}
