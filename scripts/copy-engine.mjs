import { mkdir, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const root = dirname(require.resolve('stockfish/package.json'));
await mkdir('public/engine', { recursive: true });
for (const extension of ['js', 'wasm']) {
  const file = `stockfish-19-lite-single.${extension}`;
  await copyFile(join(root, 'bin', file), join('public/engine', file));
}
// Ship the license alongside the separately loaded GPL engine.
await copyFile(join(root, 'Copying.txt'), 'public/engine/COPYING.txt');

await copyFile('THIRD_PARTY_NOTICES.md', 'public/engine/SOURCE-AND-NOTICES.txt');
