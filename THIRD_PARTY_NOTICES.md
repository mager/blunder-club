# Third-party notices

## Stockfish.js 19.0.1

The app distributes the unmodified Stockfish 19 Lite single-threaded engine from the pinned `stockfish@19.0.1` npm package. Stockfish engine code is GPL-3.0. Its license is served at `/engine/COPYING.txt`.

Corresponding source, build scripts, and instructions for this release are available from the upstream release tag:

- Source tree: https://github.com/nmrugg/stockfish.js/tree/v19.0.1
- Source archive: https://github.com/nmrugg/stockfish.js/archive/refs/tags/v19.0.1.tar.gz
- Build instructions: https://github.com/nmrugg/stockfish.js/blob/v19.0.1/README.md

Stockfish.js is maintained by Nathan Rugg and Chess.com, based on Stockfish and its contributors. No engine source modifications are made by Blunder School. The browser loads the engine as a separate worker and communicates through UCI text messages.

## Other dependencies

- chess.js: BSD-2-Clause; https://github.com/jhlywa/chess.js
- Svelte: MIT; https://github.com/sveltejs/svelte
- Lucide: ISC; https://lucide.dev/license
- Barlow Condensed and DM Sans: SIL Open Font License 1.1; self-hosted via Fontsource packages. License files remain in the corresponding npm packages.

Chess piece SVGs in `src/Piece.svelte` were authored for this prototype.
