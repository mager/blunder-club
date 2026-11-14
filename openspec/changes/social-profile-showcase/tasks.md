# Social profile showcase implementation plan

**Goal:** Turn saved games into a personal public collection and connect Nextmove play to the private library.
**Architecture:** Extend the optional public projection and existing transactions; isolate native game capture from profile editing. Keep Svelte 5, TypeScript, chess.js, and Firebase.
**Spec:** design.md and specs/profile-showcase/spec.md; specs/imported-games/spec.md.

## Global constraints

Preserve current URLs, guest/account separation, private progress, original pieces, and the one-viewport play/replay layout. Public sharing requires an exact preview and explicit publish. Work on `codex/social-profile-showcase` in the current clean checkout. The user's instruction to use judgment authorizes choosing routine design and implementation details without another approval round.

## Review focus

Old profiles without details; malformed/oversized public details; deletion of the spotlight; account switches during saving or preview; repeated save preserving title/favorite and deleted records. Tests below cover these boundaries. Exercise 320×568 and 844×390 with long text and keyboard input.

## 1. Public data and access rules

Files: src/profile.ts, src/library-cloud.ts, firestore.rules, tests/profile.test.ts, tests/library-cloud.rules.test.ts.
Interface: optional ProfileDetails as defined in design.md; fourth projectProfile argument and fifth CloudLibrary.publish argument. No changes to the private game schema.

- [x] 1.1 Add failing unit tests for details, old profiles, limits, unselected IDs, and unknown keys; implement validated projection; verify profile unit tests pass.
- [x] 1.2 Add failing emulator tests for publishing details, unauthorized/invalid writes, and atomic story/spotlight removal; extend cloud transactions and rules; verify npm run test:rules passes.

## 2. Save a played game

Files: new src/played-game.ts, new src/SaveGameDialog.svelte, src/App.svelte, new tests/played-game.test.ts, new tests/browser/played-game.e2e.ts. Keep styles local to the new dialog or reuse existing styles.
Interface: helper accepts starting FEN, SAN move history, and opponent level, returns a validated GameDraft; save operation uses GameLibrary and its existing duplicate/deletion/account guards.

- [x] 2.1 Write failing tests for legal history/result, custom start/promotion, empty/illegal moves, repeat save, title/favorite retention, and deleted snapshot rejection; implement game snapshot/save helpers; verify the new unit tests pass.
- [x] 2.2 Add the Save game dialog from More and game completion for eligible normal games; verify guest save/reload/replay, account isolation, visible errors, and active-game preservation in browser tests.

## 3. Profile editor and gallery

Files: src/GameLibraryView.svelte, src/ProfileGallery.svelte, src/library.css, new src/ShareLink.svelte, tests/browser/library.e2e.ts, new tests/browser/social-profile.e2e.ts.
Interface: ProfileGallery accepts existing profile/onOpen and optional profileId; show share controls only with profileId. Editor passes ProfileDetails through exact preview to publish. Piece.svelte supplies the avatar.

- [x] 3.1 Add browser coverage for bio/avatar/spotlight/stories and exact public preview; build the editor and gallery; verify publish/reload/anonymous replay and old-profile rendering.
- [x] 3.2 Add profile/game link copying with selectable fallback; verify clipboard failure, keyboard access, account-switch draft clearing, and no horizontal overflow at all target sizes.
- [x] 3.3 Update PRODUCT.md and DESIGN.md to describe implemented behavior; review rendered screenshots at desktop, phone, and short landscape.

## 4. Integrated verification and release

- [x] 4.1 Run npm test, npm run build, npm run spec:check, rules tests, and affected browser suites; fix material review findings and verify final diff.
- [ ] 4.2 Update HANDOFF.md with actual checks, release state, active change, and a resume prompt; commit and push completed work; deploy rules and app and verify the live version without real user writes.

## Workflow follow-up

- Archive the completed change with the CLI after checks pass; verify all baseline specs.
- Commit and push the archive and handoff result.
