import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
// @ts-expect-error The server-only middleware is native JavaScript.
import { coachMiddleware } from './server/coach.mjs';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'TYPESAFE_');
  return {
    plugins: [svelte(), {
      name: 'local-jev-coach',
      configureServer(server) { server.middlewares.use(coachMiddleware(() => env.TYPESAFE_API_KEY)); },
      configurePreviewServer(server) { server.middlewares.use(coachMiddleware(() => env.TYPESAFE_API_KEY)); },
    }],
  };
});
