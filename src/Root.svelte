<script lang="ts">
  import { onMount } from 'svelte';
  import App from './App.svelte';
  import { readLibraryRoute } from './library-routes';
  let route = $state(readLibraryRoute(location.hash));
  let libraryModule: Promise<typeof import('./GameLibraryView.svelte')> | undefined;
  const loadLibrary = () => libraryModule ??= import('./GameLibraryView.svelte');
  onMount(() => {
    const navigate = () => { route = readLibraryRoute(location.hash); };
    window.addEventListener('hashchange', navigate);
    window.addEventListener('popstate', navigate);
    return () => { window.removeEventListener('hashchange', navigate); window.removeEventListener('popstate', navigate); };
  });
</script>

{#if route}{#await loadLibrary()}<main class="library-page"><p role="status">Opening your games…</p></main>{:then module}<module.default {route}/>{:catch}<main><p>Your games could not load. Reload this page to try again.</p><a href="#/play">Back to game</a></main>{/await}{:else}<App/>{/if}
