# Opening names

Game pages show the opening family from the latest recognized position in the displayed history. This includes free play, authored lessons, isolated rehearsal, and private/public imported replay. A custom FEN only supplies its actual position and subsequent moves; imported Opening/ECO tags are not trusted.

The reference is [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings), pinned at [3ba6b20d31b2e6125cb0e6a2e792f400717d9d39](https://github.com/lichess-org/chess-openings/tree/3ba6b20d31b2e6125cb0e6a2e792f400717d9d39). Its data is public domain under CC0; the full dedication is in `licenses/chess-openings-CC0.txt`.

`node scripts/build-opening-index.mjs` downloads the five pinned source tables, validates all 3,865 lines with chess.js, and writes the 3,865-position / 149-family index. Names use the part before a colon; detailed variations are deliberately omitted from the compact game label. The generated JSON is committed. Normal builds and recognition do not call an external service. Vite emits the reference as a separate lazy chunk, so it does not block game or engine startup.

Position keys retain placement, turn, castling rights, and legal en passant rights. Move counters are excluded. Matching positions recognizes transpositions; walking history backwards preserves the latest name beyond known theory. The dataset is broad but not exhaustive, and opening naming can vary between references. Unknown positions say Not identified. The standard initial board says Play the first move. A failed chunk load says Name unavailable and leaves play usable.

Run `npx vitest run tests/opening-name.test.ts` for recognition checks. Use a separate test origin and fresh browser context for `tests/browser/opening.e2e.ts` (default `127.0.0.1:5176`). No signed-in account or emulator is needed for this suite.
