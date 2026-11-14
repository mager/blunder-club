# Design

## Context

The existing library stores validated PGN records in isolated IndexedDB/account stores. Public profiles are explicit snapshots of at most eight favorites, with random stable IDs. The game page has no library save action. See proposal.md for purpose. The user asked us to use our judgment and be creative; scope and design choices below are the agent's choices.

## Goals / Non-Goals

Extend the existing profile rather than add another identity system. Keep the original game, lesson records, private notes, and Google identity separate from publication. No new dependencies, feeds, social counters, arbitrary external avatar URLs, or uploaded media.

## Decisions

### Approaches

1. Improve the existing public collection (chosen): identity, stories, a spotlight, and direct Nextmove game saving. This meets the request using current account and replay boundaries.
2. Add a follower feed: introduces discovery, moderation, notifications, and social pressure without improving the core game-sharing flow. Excluded from this version.
3. Only restyle the gallery: less work, but leaves Nextmove games disconnected from the profile. Rejected.

### Public contract

Keep version 1 readable with no migration write. Add an optional `details` object to `PublicProfile`: `ProfileDetails = { bio: string; avatar: 'n' | 'r' | 'q'; spotlight: string | null; stories: Record<string, string> }`. Bio and each story are trimmed plain text, at most 160 characters, without control characters. Spotlight and story keys refer only to included public game IDs. At most eight story entries. Unknown keys are rejected in readers and rules. Details validation runs on the mandatory coordinated settings write, while game validation runs on the public write, to fit the rule expression limit at eight games; public writes require a settings revision advance. `projectProfile(name, games, revision, details?)` and `CloudLibrary.publish(uid, name, games, expected, details?)` preserve the old call shape. Omitting details preserves old behavior.

Removing a game prunes its story and clears its spotlight in the same transaction. Publication uses committed game revisions and the exact preview details. UI drafts reset on account switch. Edits remain unpublished until the explicit update succeeds. No new URL shape: profile, finish, and selected-move routes retain their current validation.

### Save from play

Use a small new played-game helper and a focused Save game dialog. Capture the true live game from its starting FEN and history, never a warning/rehearsal board. Normal free/custom games with at least one move are eligible, including unfinished games; lessons and personal practice are excluded. Label White as You and Black as Nextmove (selected opponent), never copy Google identity. Use a stable unknown date so repeated saves of the same position deduplicate through the existing game identity. Retain existing titles/favorites on duplicate saves and require explicit restore after deletion. The IndexedDB write transaction checks the current account predicate and any existing record before inserting, so another tab cannot race the duplicate check. Keep account generation guards on asynchronous reads/writes and visible local/cloud status. No automatic publication, no opponent move in the saved replay, and no new lesson credit.

### Surface direction

Experience mode for the public gallery; Operate mode for editing. Preserve graphite, jade, blue/white boards, DM Sans, original Piece.svelte artwork, and 44px targets. The public first viewport has a chess-piece avatar and large name with a short bio, a share action, then a two-column spotlight: a large final-position board and its title, story, result, and replay actions. The remaining collection uses compact rows. At 320px the spotlight stacks. Editor identity and publication controls precede the private favorite list, so sharing is easy to find. The preview is the exact gallery, with sharing disabled until publication. Empty and old profiles have honest fallback states. No invented counts or claims. Profile pages may scroll; live play and replay must still fit one viewport.

## Risks / Trade-offs

- Rules and app field drift → test full coordinated writes, old profiles, invalid fields, unauthorized writes, and atomic removal with the emulator.
- Save races with account changes → capture scope, invalidate old requests, retain the original game.
- A saved partial game is a snapshot → show its unfinished result; saving a longer history creates a distinct snapshot.
- Clipboard access can fail → display a selectable link and a truthful status.
- Old deployed clients reject new details → deploy compatible rules before the app; do not roll back to a client that cannot read details without a compatibility patch.

## Migration Plan

No bulk data migration. Old profiles render with an original knight avatar and no biography/story. Deploy tested allowlisted rules, then the app. Verify the deployed assets and guest flow without publishing any real account data. Roll back with a compatible client, retaining optional details support.
