# Proposal

## Why

Players bring games they care about from other chess sites, but Nextmove cannot yet save or replay those games. They need a way to learn from their own moves and show selected favorite games on a profile.

## What Changes

- Paste one standard-chess PGN, check its legal main line, choose which side was yours, and save it without replacing the current game. Accept annotations such as `$6`; do not treat them as Nextmove analysis.
- Add a private game library and a separate replay view. Support White and Black imports, move navigation, a title, and a favorite flag.
- Build private style notes from the chosen side's actual moves. Show counts, source games, and sample size. Use repeated patterns to suggest existing lessons, with a short reason. Do not claim a fixed style from one game or train a model.
- Add an owner profile with favorite games. A signed-in player can publish a separate, minimal showcase and copy its stable link. Visitors can replay featured games without signing in. Saving or favoriting a game does not publish it.
- Keep game records separate from the existing compact progress payload. Preserve guest/account isolation, failed-write recovery, duplicate handling, and deletions.
- Keep private imported games, style notes, practice results, Google account details, and the current board out of public profile documents and URLs.

Out of scope: site account connections, bulk PGN files, nonstandard chess variants, model training, social feeds, comments, likes, follower counts, ratings, automatic publication, and automatic changes to the live opponent. Imported games do not award lesson credit. Engine grading and new practice positions from imports are a later change; this version uses measured move facts to suggest existing authored lessons.

## Capabilities

### New Capabilities

- `imported-games`: PGN validation, private library storage, replay, and evidence-based style notes with lesson suggestions.
- `profile-showcase`: Owner profile, explicit publication of selected favorites, public replay, and removal from publication.

### Modified Capabilities

- `progress-sync`: Isolated, bounded game-library storage and safe account transfer in addition to existing progress.
- `journey-and-routes`: Stable owner-library, replay, and public profile routes that preserve the current game.

## Impact

- Add typed PGN/library/style modules and small Svelte components for import, library, profile, and replay. Use the installed chess.js parser and existing Board/Piece components.
- Extend `src/App.svelte` navigation and `src/routes.ts` without treating replay as live play. Reuse current lessons from `src/curriculum.ts`.
- Add game-library and showcase persistence beside `src/cloud.ts`; keep `src/progress.ts` migration backward compatible. Current Firestore progress writes are capped at 150,000 characters and cannot hold a growing game library.
- Extend `firestore.rules` with narrowly scoped private game records and public showcase records; private progress remains owner-only. Add executable rules tests, not only a JSON case list.
- Add parser, style, routing, storage, account-switch, publication, and viewport checks. Update product/design records when behavior ships.

Planning assumptions: one PGN per import; no identity proof for pasted player names; guests can import and favorite locally; public sharing requires Google sign-in; a public display name is chosen separately from the Google account name. Favorites are private until the player selects Publish profile. Public profiles are shareable by link; search discovery and social preview cards are outside this change.
