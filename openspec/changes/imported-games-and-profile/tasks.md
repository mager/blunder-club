# Tasks

All implementation work is pending. The planning example in `examples/pawn-mate.pgn` preserves the supplied moves with anonymous names. It is not a seeded user game or a published favorite.

## 1. PGN records and private storage

- [ ] 1.1 Implement the bounded PGN parser and canonical record; test the supplied example (71 half-moves, h4 mate), Black selection, comments, NAGs, variations, custom FEN, result conflicts, illegal moves, empty input, multiple games, and unsupported variants.
- [ ] 1.2 Implement game identity, title/side/favorite edits, duplicate detection, and deletion/restore; verify annotation-only edits deduplicate while different opponents remain separate.
- [ ] 1.3 Add isolated guest/account IndexedDB storage with limits and pending writes; test reload, quota failures, corrupt records, and old progress saves without changing the original board or lesson evidence. Document storage limits and keys.

## 2. Evidence and lesson suggestions

- [ ] 2.1 Implement versioned selected-side facts and source links; verify the example has 36 White moves, 10 checking moves including mate, 9 captures, d4 first, and castling on move 9. Test Black moves, promotions, en passant, and custom-start exclusions.
- [ ] 2.2 Implement the documented three-game pattern thresholds and `castle-short`, `italian`, and `queens-gambit` suggestions; test denominators, priority, unmatched evidence, deletion, side correction, and no lesson credit. Document that notes are move facts, not engine grades or fixed style labels.

## 3. Private cloud library

- [ ] 3.1 Add per-game transactions, revisions, tombstones, and idempotent guest transfer; test partial failure, repeated transfer, stale edits, explicit restore, and conflicts with retained local changes.
- [ ] 3.2 Integrate account lifecycle and pending-write recovery; verify account switches discard late results, sign-out exposes no account records to guests, and existing progress sync tests still pass.
- [ ] 3.3 Add private game/settings/ownership rules and an executable emulator test command; verify owner access, cross-account denial, schema/size validation, revisions, and unchanged private-progress access. Document the command and required local tooling without credentials.

## 4. Import, owner profile, and replay

- [ ] 4.1 Extend routes and view dispatch for the owner library/profile and isolated replay; test private namespace lookup, malformed IDs, ply bounds, browser history, reload, and existing game links.
- [ ] 4.2 Build the PGN dialog, private library, favorite controls, and private style notes with source links; verify labeled input, side choice, retained error input, duplicate flow, empty/loading/error states, and keyboard focus. Update PRODUCT.md for implemented behavior.
- [ ] 4.3 Build read-only replay and board previews with safe IDs, orientation, move controls, Open finish, and Back to game; verify mate, check, castling, promotion, Black/custom-FEN games, and pending engine/opponent callbacks without altering the saved live game or lesson run.
- [ ] 4.4 Check the owner screens and replay at 1440×900, 320×568, and 844×390 on a separate local test origin; verify keyboard input, visible controls, scroll behavior, and reduced motion. Record checked UI behavior in DESIGN.md and the matching surface brief while preserving current tokens.

## 5. Public favorites

- [ ] 5.1 Implement bounded publication projections, private ownership mapping, revisions, and atomic publish/update/unpublish operations; test that private fields, arbitrary PGN tags, and account identifiers cannot enter the public projection.
- [ ] 5.2 Add public Firestore rules and emulator tests; verify anonymous direct reads, denied collection listing, denied private reads, rejected non-owner writes, ownership immutability, malformed/oversized fields, stale publish drafts, and denied fresh reads after unpublish.
- [ ] 5.3 Build owner public-name/selection controls and an exact visitor preview with Publish/Update/Unpublish; verify favorite alone stays private, failed writes do not claim success, and deleting/unfavoriting featured games atomically removes public data or clearly reports pending removal.
- [ ] 5.4 Build stable public profile/game routes and signed-out replay; test missing/unpublished/invalid content, move-link reloads, and preservation of the visitor's guest game. Verify both profile and replay at all three target sizes; document the public/private boundary and publication behavior.

## 6. Integration and handoff

- [ ] 6.1 Run `npm test`, `npm run build`, `npm run spec:check`, and the new rules emulator command; record actual results and fix failures before marking complete.
- [ ] 6.2 Verify an end-to-end test-account flow: paste the example, choose side, save, reload, favorite, preview, publish, open anonymously, replay the finish, unpublish, and confirm no fresh public read. Keep the user's real game untouched.
- [ ] 6.3 Review the final diff and update HANDOFF.md with tested state, remaining work, actual commit/release references, and a resume prompt. Verify every task marked complete has its stated evidence.

## Workflow follow-up

- Archive through `npm run openspec -- archive imported-games-and-profile` only after implementation and checks are complete; verify merged baseline specs.
- Commit and push completed work. Deploy matching Firestore rules before the app release; verify the deployed app version and test publication/removal. Report commit, push, rules deployment, and app deployment separately.
