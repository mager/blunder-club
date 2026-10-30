import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
// @ts-expect-error The server-only middleware is native JavaScript.
import { coachMiddleware } from './server/coach.mjs';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'TYPESAFE_');
  return {
    build: { rollupOptions: { input: { main: fileURLToPath(new URL('./index.html', import.meta.url)), about: fileURLToPath(new URL('./about/index.html', import.meta.url)) } } },
    plugins: [svelte(), {
      name: 'local-jev-coach',
      configureServer(server) { server.middlewares.use(coachMiddleware(() => env.TYPESAFE_API_KEY)); },
      configurePreviewServer(server) { server.middlewares.use(coachMiddleware(() => env.TYPESAFE_API_KEY)); },
    }],
  };
});
