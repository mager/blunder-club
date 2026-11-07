/** Rebuild the bundled CC0 opening families. No network is used during app builds. */
import { mkdir, writeFile } from 'node:fs/promises';
import { Chess } from 'chess.js';

const revision = '3ba6b20d31b2e6125cb0e6a2e792f400717d9d39';
const base = `https://raw.githubusercontent.com/lichess-org/chess-openings/${revision}`;
async function source(file) {
  const response = await fetch(`${base}/${file}`);
  if (!response.ok) throw new Error(`${file}: ${response.status}`);
  return response.text();
}
const files = await Promise.all(['a', 'b', 'c', 'd', 'e'].map(letter => source(`${letter}.tsv`)));
const names = [];
const positions = {};
let lines = 0;
for (const file of files) {
  for (const row of file.trim().split('\n').slice(1)) {
    const [, name, pgn] = row.split('\t');
    const game = new Chess();
    game.loadPgn(pgn); // Validate every source line with the app's rules library.
    const family = name.split(':')[0];
    let id = names.indexOf(family);
    if (id === -1) { id = names.length; names.push(family); }
    const key = game.fen().split(' ').slice(0, 4).join(' ');
    // Stable first match where the reference has aliases for the same position.
    positions[key] ??= id;
    lines++;
  }
}
await mkdir('src/data', { recursive: true });
await mkdir('licenses', { recursive: true });
await writeFile('src/data/opening-index.json', JSON.stringify({ names, positions }) + '\n');
await writeFile('licenses/chess-openings-CC0.txt', await source('COPYING.txt'));
console.log(`${lines} legal lines, ${Object.keys(positions).length} positions, ${names.length} opening families; revision ${revision}`);
