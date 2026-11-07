# Nextmove session handoff

Updated 2026-11-07. Work in `/Users/mager/Code/blunder-club`, not `magerblog`.

## Latest session: clear pieces and automatic hints (November 7)

Implemented on `codex/clear-pieces-auto-hints`, based on `3a24cb8`. The user selected classic pieces with a clear king.

- Original SVG pieces have clearer classic silhouettes. The king has a larger cross, broader body/base, and greater height. All board, replay, miniature, and promotion views share the designs. Existing colors and viewport layout remain.
- Automatic hints default on, with a saved On/Off switch in Coach settings. Hint arrows and Play reuse existing controls. Hide hint or selecting a piece hides the current suggestion; a prepared new turn shows a new one. After-game free play and Try without hints suppress automatic hints. Manual hints remain available.
- Shown hints persist assistance evidence. Starting a repeat without hints sets recall before preparing the first position. Leaving recall clears it; restored warnings clear the prior hint.
- Test-origin guest sessions and demo Firebase emulators protect real account/game data. Unit tests: 154 pass, four unrelated rules tests skipped. Build: zero Svelte errors/warnings; existing 529 kB main-bundle advisory remains. Strict specs: all nine baselines plus the active change pass. All 15 browser checks pass, including desktop 1440x900, phone 320x568, and landscape 844x390; keyboard, hint toggle/reload, assisted/independent completion, promotion, check, warning restoration, library, profile, and account flows.
- Impeccable detector returned no findings. Rendered screenshots reviewed at all three sizes; no clipping. A separate code reviewer found two transition issues; both have regression tests and are fixed. Review found no remaining actionable issue. Evidence: ignored `.impeccable/review/pieces-hints-*.png` and `hint-settings-*.png`.

### Release state

Implementation commit `f6b529f` is pushed to `origin/codex/clear-pieces-auto-hints`. `vercel --prod --yes` succeeded and aliased https://blunder-school.vercel.app/ to https://blunder-school-4vv4if1zp-mager1s-projects.vercel.app. No merge to main.

- Live `main-D3A2DabW.js` matches the tested local build byte-for-byte by SHA-256 (`61c1444cd90e02b79b239167bb6a5484fc1b288e8fa1d3e9cf052a76c3d7a433`).
- All six hint/piece browser tests pass on production in fresh agent-owned guest contexts, including three viewport sizes, opt-out/reload, assisted and independent completion, transition regressions, promotion, and check. No real account data was changed.
- OpenSpec archived the completed change as `2026-11-07-clear-pieces-auto-hints` and updated three baseline specs. All nine baseline specs pass strict validation; no active change or implementation task remains.
- This documentation/archive follow-up is committed and pushed after the verified app release. It does not change app code and needs no app redeployment. The existing bundle-size advisory and old design-sidecar/config drift remain optional maintenance, not unfinished work for this request.

### Resume prompt

“Read AGENTS.md and HANDOFF.md in `/Users/mager/Code/blunder-club`. Continue `codex/clear-pieces-auto-hints`. Check release status before work. Preserve the classic pieces, automatic hint preference, honest assistance evidence, opening labels, and one-screen board.”

## Previous session: opening names during play (November 7)

The user asked for visible opening names during games and an explicit learning-site purpose in AGENTS.md. Implemented on `codex/game-opening-names`, based on shipped commit `858f0bc` from `codex/imported-games-and-profile`.

- A compact Opening row sits above the board in live play, lessons, and private/public game replay. It uses the existing palette and wraps full family names.
- The bundled Lichess CC0 reference covers 3,865 legal positions and 149 opening families. Recognition uses board state, turn, castling, and legal en passant rights. It supports transpositions and keeps the latest known name after later moves leave theory. The supplied d4/a5/e4/Nc6 position is Ware Defense.
- Undo, reload, replay selection, and rehearsal use only displayed history. Custom FENs do not invent earlier moves. Initial, unknown, loading, and failed-load states are explicit. Imported metadata is not trusted.
- The data is a separate lazy chunk (259.48 kB, 35.29 kB gzip). No external opening service, save migration, new curriculum, or account change. Source, license, rebuild instructions, and limits are in `docs/opening-names.md`.
- AGENTS.md now explicitly calls Nextmove a chess learning site and requires useful learning context during games. PRODUCT.md and DESIGN.md describe the new row.

### Opening-name verification

- `npm test`: 153 passed, four unrelated Firestore emulator tests skipped.
- `npm run build`: zero Svelte errors or warnings. The existing main-chunk advisory remains (528.21 kB, 170.53 kB gzip).
- Strict specs passed all nine baselines plus the active change before archive.
- All seven browser checks passed on fresh guest contexts at `127.0.0.1:5176`: game naming, undo, reload, hints, reset, keyboard lesson play, ignored PGN opening metadata, replay navigation/reload, failed data load, longest-family wrapping, arbitrary FENs, and rehearsal stages. Existing guest import/game preservation and lesson-assistance/custom-promotion replay checks also pass.
- Desktop 1440×900, phone 320×568, and landscape 844×390 fit checks and screenshots pass. A separate code reviewer found no actionable defect and confirmed screenshot readability. Screenshots are in ignored `.impeccable/review/opening-*.png`.
- Impeccable detector reported only type-size advisories against its old sidecar. All sizes are documented in DESIGN.md; no new style defect. The existing sidecar/config drift was not expanded into this task.

### Opening-name release state

Implementation checks are complete. OpenSpec archived the change as `2026-11-07-show-game-opening` and updated the board-presentation baseline. All nine baseline specs pass strict validation; no active change remains. Implementation commit `8ce1bee` is pushed to `origin/codex/game-opening-names`. No merge to main was made. The prior release notes below are historical.

- `vercel --prod --yes` succeeded and aliased https://blunder-school.vercel.app/ to https://blunder-school-hrkf2yfxt-mager1s-projects.vercel.app. Remote build had zero Svelte errors/warnings and the known chunk-size advisory.
- Live `main-BN2nQdH4.js` and `opening-index-D96MYYOh.js` match the tested local build byte-for-byte by SHA-256.
- A fresh, agent-owned production guest context passed the supplied Ware Defense game at all three viewport sizes, reload, undo to Queen's Pawn Game, Italian lesson completion at compact sizes, and unknown custom-FEN promotion. No page errors. No real account data or public profiles were modified.
- No implementation tasks or active OpenSpec change remain. This handoff-only follow-up is committed and pushed after the verified implementation; no app redeployment is needed for it. The main bundle advisory and old Impeccable design sidecar/config drift remain optional separate maintenance.


### Resume prompt

“Read AGENTS.md and HANDOFF.md in `/Users/mager/Code/blunder-club`. Continue from `codex/game-opening-names`. Preserve the visible opening label, learning-site purpose, saved games, and one-screen board layout. Check the release state before making changes.”

## Previous session: game imports and public favorites

The user approved implementation of `imported-games-and-profile`. The feature is live. Source is on `codex/imported-games-and-profile`, based on `7469989` on main. The user restored Firebase CLI access on November 5; rules and app deployment then succeeded.

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
- Implementation commit `27a995f` is pushed to `origin/codex/imported-games-and-profile`. Planning commits `a292db6` and `02eb381` are also pushed. A handoff-only follow-up records this result. The working tree was clean before this handoff update.
- Archived as `openspec/changes/archive/2026-11-04-imported-games-and-profile/`; the CLI merged all four deltas into baseline specs.
- On November 5, `firebase deploy --only firestore:rules --project blunder-school-513120 --non-interactive` compiled and released the rules successfully. The previous HTTP 401 blocker is resolved.
- Then `vercel --prod --yes` deployed source commit `fb036db` (implementation `27a995f`) to https://blunder-school-6wcsu83sd-mager1s-projects.vercel.app and aliased https://blunder-school.vercel.app/. Remote build: zero Svelte errors/warnings; the known 527 KiB chunk advisory remains.
- Production `main-sP8HZe5q.js` matches the tested local file byte-for-byte (SHA-256 comparison). A fresh, agent-owned guest browser passed PGN import, selected-side facts, Open finish at h4 mate, selected-move reload, previous move, and unavailable public profile. No page errors. Only local guest storage was written; no real account games or public profiles were created.
- Live anonymous Firestore checks: missing public profile 404, private game 403, private progress 403, profile collection listing 403. Authenticated publication and removal were verified in the prior emulator suite, not repeated against a real production account.
- No merge to main was made. The feature branch contains the shipped source and the release handoff. Push the handoff-only follow-up before ending; no other implementation work remains.

## Remaining limits

Live play is White-only; imported replay supports either side. Style notes use a small set of transparent rules. Public profiles allow direct-link access, not browsing or search. Engine analysis remains bounded. Progress counters use maximum values across devices. The optional Jev endpoint has warm-instance controls, not a durable shared quota. These are later-work options, not authorization to expand scope.

## Resume prompt

“Read AGENTS.md and HANDOFF.md in `/Users/mager/Code/blunder-club`. Check Git status and OpenSpec. The November 5 release is verified live; source is on `codex/imported-games-and-profile`. Continue from the saved release state. Preserve the private library, explicit profile publication, saved game, and board-first layout.”
