# Nextmove session handoff

Updated 2026-11-04. Work in `/Users/mager/Code/blunder-club`, not `magerblog`.

## Latest session: game imports and public favorites

The user approved implementation of `imported-games-and-profile`. The feature is complete locally on `codex/imported-games-and-profile`, based on `7469989` on main. Implementation release is blocked by an expired Firebase login; production is unchanged.

- Paste a single annotated PGN, validate every main-line move with chess.js, choose White or Black, and save in a separate private game library. Comments and variations are not analysis. Limits: 128 KiB input, 1,000 half-moves, 100 active records, 40 KiB per record.
- Replay saved games from either side, use move keys or controls, open the finish, and retain the selected move through reload/history. Live game and lesson evidence stay separate. Leaving play disposes its engine/opponent workers.
- Style notes show selected-side move facts with source links. Three eligible games and a two-thirds threshold can suggest a castling, Italian, or Queen’s Gambit lesson. This is deterministic evidence, not model training or an engine grade. Imports give no lesson credit.
- Favorites stay private. Choose a public name and up to eight favorites, inspect the exact visitor preview, then Publish or Update. Public profiles and replay use random public IDs. Unpublish removes the public snapshot; unfavorite/delete removes a featured game atomically. Failed cloud changes remain pending with an error.
- IndexedDB separates guest/account data. Revision checks, tombstones, explicit restore, retained local conflicts, and commit-before-consume guest transfer protect saved games. Public snapshots exclude account IDs, email, ratings, dates, comments, and private style evidence.
- The supplied 71-half-move game is an anonymous test fixture only. White has 36 moves, 10 checks including mate, 9 captures, castles on move 9, and mates with `36. h4#`. No real user game or profile was created or published.

## Verification

- `npm test`: 148 passed; the four emulator tests are skipped in this command.
- `npm run test:rules`: all four Firestore rules/transaction tests passed on `demo-nextmove`. Covers owner isolation, malformed/oversized writes, stale revisions, allowlisted public snapshots, denied listing, immutable ownership, atomic featured removal, unpublish, and tombstones.
- `npm run build`: zero Svelte errors/warnings. Vite reports the main bundle at 527 KiB (170 KiB gzip), above its 500 KiB advisory threshold. Library UI is a separate lazy chunk. This warning is not hidden.
- Strict spec validation passed all nine baseline specs after archive. All 19 tasks are complete; no active change remains.
- Four Playwright tests pass on separate origin `127.0.0.1:5176` with local Auth/Firestore emulators. Tests cover invalid input retention, duplicate import, replay/reload/history/keyboard, Black orientation, guest transfer, exact preview/publish, anonymous finish/reload, unpublish, sign-out isolation, preserved live game, lesson hint evidence, and custom-FEN promotion/check.
- Verified desktop 1440×900, phone 320×568, and landscape 844×390. Replay board, guide, and controls fit without document overflow. Secondary library/profile pages can scroll. Reduced-motion replay works.
- Impeccable finish reviewer inspected eight screenshots. Both findings were fixed: mobile header link names and clipped landscape move notation. Final verdict: Ship. Evidence remains in ignored `.impeccable/review/`.
- Existing 25 authored lessons, blue/cool-white board, original white/navy SVG pieces, graphite shell, jade actions, and Google progress save remain intact. Existing lesson tactics were not changed.

## Source and test guide

Read `PRODUCT.md`, `DESIGN.md`, the matching `.impeccable/surfaces/` brief, and `docs/game-library.md`. The latter documents storage, privacy boundaries, emulator setup, and browser tests. Java 21 and Firebase CLI are required for emulator tests; Homebrew Java 21 is installed locally. Browser tests reject non-demo Firebase projects and require Auth emulator connections.

- `src/Root.svelte`: isolates live play from lazy library/profile views.
- `src/imported-games.ts`, `src/library-store.ts`, `src/library-cloud.ts`: PGN, local storage, transactions, publication.
- `src/playing-style.ts`, `src/profile.ts`, `src/library-routes.ts`: evidence, allowlisted projection, validated links.
- `src/GameLibraryView.svelte`, `src/GameReplay.svelte`, `src/ProfileGallery.svelte`, `src/MiniBoard.svelte`, `src/library.css`: owner and visitor interfaces.
- `src/firebase-client.ts`: shared Firebase setup; emulator connections are development-only.

## Release state

- Repository: https://github.com/mager/blunder-club.
- Production: https://blunder-school.vercel.app/ (Vercel project `blunder-school`).
- Firebase project: `blunder-school-513120`. Deploy additive Firestore rules before the app.
- Prior planning commits `a292db6` and `02eb381` are pushed. Current implementation and docs are not yet committed at this checkpoint.
- Archived as `openspec/changes/archive/2026-11-04-imported-games-and-profile/`; the CLI merged all four deltas into baseline specs.
- `firebase deploy --only firestore:rules --project blunder-school-513120 --non-interactive` failed with HTTP 401 while checking the Firestore API. No rules or app deployment succeeded. The user must run `firebase login --reauth`, then the rules deployment can be retried before releasing the app. Do not deploy this app before its rules.
- No merge to main or Vercel production deploy was attempted. The previous verified live release remains `e45fffe`, deployment `blunder-school-flsgjkefu-mager1s-projects.vercel.app`.

## Remaining limits

Live play is White-only; imported replay supports either side. Style notes use a small set of transparent rules. Public profiles allow direct-link access, not browsing or search. Engine analysis remains bounded. Progress counters use maximum values across devices. The optional Jev endpoint has warm-instance controls, not a durable shared quota. These are later-work options, not authorization to expand scope.

## Resume prompt

“Read AGENTS.md and HANDOFF.md in `/Users/mager/Code/blunder-club`. Check Git status and OpenSpec. After `firebase login --reauth`, deploy Firestore rules, deploy the tested app with Vercel, verify production, and record the release. Preserve the private library, explicit profile publication, saved game, and board-first layout.”
