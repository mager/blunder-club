# Proposal

## Why

Players can publish imported favorites today, but the profile has little personal identity and games played in Nextmove cannot enter the library directly. Give each player a deliberate public collection that tells the story of their games.

## What Changes

- Extend profiles with an optional 160-character bio, a chosen original chess-piece avatar, and one spotlight game from the selected favorites.
- Add an optional 160-character public story for each selected game. Show the exact identity, stories, and moves in the publication preview.
- Present a distinctive profile header and a larger spotlight board, followed by the remaining game collection. Offer profile and selected-game links with clipboard fallback.
- Save a normal Nextmove game to the private library from the game menu or completion view. Use legal move history, preserve the active game, deduplicate repeated saves, and keep publication explicit.
- Keep old profiles readable, account isolation intact, and existing stable replay links valid.
- Out of scope: follows, comments, feeds, search, ratings, uploaded photos, and live multiplayer.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `profile-showcase`: personal identity, spotlight, game stories, and share actions.
- `imported-games`: directly save played Nextmove games into the same private library.

## Impact

Svelte profile/editor/gallery, game save action, profile projection, library transactions, Firestore rules, and unit/emulator/browser tests. No new dependencies. Existing version-1 profiles remain readable. Public profile fields remain explicitly allowlisted.
