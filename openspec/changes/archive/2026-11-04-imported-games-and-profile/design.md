# Design

## Context

See `proposal.md` for the player need. The current app has one playable game, authored lessons, saved mistake positions, Google sign-in, and private Firestore progress. There is no game library or public profile.

`src/App.svelte` owns live board state and starts analysis/opponent work during restore. `src/routes.ts` assumes every view belongs to that game. `src/progress.ts` normalizes a compact save; `src/cloud.ts` transfers guest progress and checks remote revisions. Firestore permits only owner access to `/users/{uid}/progress/current` and caps its serialized payload at 150,000 characters. Imported games need a separate lifecycle.

## Goals / Non-Goals

**Goals:** Keep imported chess history immutable, make replay safe, derive inspectable style facts, and publish a deliberately small projection of chosen favorites.

**Non-Goals:** No change to the legal-move authority, authored lesson acceptance, live opponent behavior, or existing progress merge rules. Do not route imported games through the current White-only `buildReport` loop. This change does not add engine grading or new personal-practice positions from imports.

## Decisions

### 1. Normalize a PGN once, then replay canonical moves

Add `src/imported-games.ts` with a typed record and parser based on the installed chess.js. Use one bounded PGN per import: at most 128 KiB of UTF-8 input and 1,000 half-moves. Reject multiple games rather than silently taking the first. Accept standard-chess FEN starts; reject unsupported Variant tags and malformed setup headers. Explicitly check result/header consistency. A nonterminal board can have a resignation or agreement result; an absent result is `*`. A terminal board must match its forced result.

Persist schema version, immutable starting FEN and UCI main line, a small header allowlist, selected side, title, favorite state, and edit revision. Strip arbitrary comments, URLs, and grading annotations from the stored canonical record. Ratings can appear in the private import preview as source metadata, but are not Nextmove ratings or style evidence. Use plain text rendering, never HTML from PGN tags.

A SHA-256 fingerprint of canonical starting FEN, main line, normalized White/Black names, source date, and result detects repeat imports. Whitespace, comments, numeric annotations, selected side, and custom title do not affect this identity. Equal moves with different opponents remain separate games. Preview duplicate records and allow side/title correction rather than creating a second record. Identical repeated games with no distinguishing metadata collapse into one; document this limit.

Alternative rejected: saving arbitrary source PGN as the primary record. It increases storage and publication risk, complicates identity, and preserves untrusted grading as if it were app evidence.

### 2. Derive style facts locally, with evidence links

Add `src/playing-style.ts` as a pure function of validated, nondeleted library records. Version the rules. Derive each game once per content/side version. Never call Jev for these notes.

- Group first-move choices by side for games that start from the standard initial position. A Black first move is described as a response, not an opening diagnosis.
- Count chosen-side moves, checking moves (including mate), captures, and castling side/move number. Show counts and denominators; do not call a high check count good play.
- For castling by the player's tenth move, include only standard-start games with at least ten moves by that player. Short games and custom starts are excluded from this denominator.
- With one or two eligible games, show facts and “Add more games to compare your choices.” With at least three, show repeated observations with exact counts and source links.
- Suggest one existing lesson: first, if at least two-thirds of at least three eligible games have no castling by the player's tenth move, suggest `castle-short`. Otherwise, if at least two-thirds of at least three standard-start White games open with e4, suggest `italian`; if they open with d4, suggest `queens-gambit`. These IDs exist in the typed curriculum. Otherwise show no personal suggestion. The reason describes observed choices, not a verified error. These are transparent product rules, not statistical confidence estimates.

Recompute after deletion or side correction. Store no aggregate counters that could be counted twice during sync. Import/replay never changes `played`, `practiced`, `studyResults`, or independent credit. Existing lesson controls stay available, and normal authored rules apply after starting a suggestion.

Alternative rejected: naming the player an “aggressive attacker” after one win, or treating `$2` as our engine verdict. Neither is supported by the evidence.

### 3. Give the library independent, isolated persistence

Add a small IndexedDB store for guest and per-account records, metadata, and a pending-write queue. Use account-scoped keys and an auth-generation guard like the one in `src/cloud.ts`. Bound the first version at 100 active games and 40 KiB per normalized game record. Check size before writes and report quota failures. Never silently evict favorites or games. Existing progress data stays in its current storage format; no destructive migration is required.

Sync private records to `/users/{uid}/games/{gameId}` with a schema version, revision, bounded payload, and server update time. Validate on every read. Per-game transactions compare revisions. Conflicts preserve both the local pending edit and remote version for a visible retry/reload choice. A failed library load must not appear to be an empty successful load.

Use retained tombstones for removals; a stale revision cannot recreate a deleted record. Intentional re-import of a deleted game uses an explicit restore action against its current tombstone revision. Guest-to-account transfer is idempotent per fingerprint; consume a guest record only after its corresponding transaction succeeds. Keep game transfer status separate from existing progress transfer so success in one does not erase pending data in the other. Retain pending changes across reloads.

Alternative rejected: placing all games inside `Progress`. Its current payload limit, whole-document conflict policy, and active-board timestamp make that unsuitable for growing histories.

### 4. Publish a separate public snapshot

Use a random public profile ID, not a Firebase UID or a claimed chess-site username. An owner-only mapping at `/profileOwners/{publicId}` ties it to the authenticated owner; an owner-only settings document under `/users/{uid}` stores the ID. Ownership is immutable. Public content at `/profiles/{publicId}` contains only schema version, revision, chosen display name, and up to eight selected game snapshots. Each snapshot contains its own public game ID, title, player names, chosen side, result, canonical starting position, and moves. Exclude private record IDs, ratings, comments, arbitrary headers, account details, and style notes.

Use one bounded profile document so publication and removal of featured games are atomic. Cap display name at 40 characters, title at 80, player names at 80, each snapshot at 40 KiB, and the document below 400 KiB. Firestore rules validate allowed fields, types, limits, immutable ownership, and revision increments; the client also validates chess legality on every public read. Rules cannot establish that a PGN came from a real chess-site account; do not show a verified identity badge. Deny profile collection listing; allow direct reads of published records. Test all rules in an emulator.

First publish creates the private ownership mapping and public document in a transaction with rules checking post-write ownership. Later publication checks the current public revision. Unpublish deletes the public snapshot and retains ownership/settings so its stable ID can be reused by the owner. No public write occurs from background library sync. An old publication draft cannot overwrite a newer revision or recreate an unpublished profile as an automatic retry; require a fresh preview and explicit publish.

Favorite removal or deletion of a featured private game uses a transaction that changes the private record and public snapshot together. If offline, queue the intent and show “Public removal pending”; never claim it is already gone. Unpublish keeps private games. Already copied or downloaded public content cannot be recalled; the promise is removal from future app reads.

Alternative rejected: making existing `/users` data public or embedding an entire PGN in a share URL. Both expose fields outside the chosen showcase and make updates/removals unreliable.

### 5. Separate replay routes from playable routes

Extend the route model with a discriminated union while retaining existing game serialization:

| Route | Meaning |
| --- | --- |
| `#/me` | Owner profile and private style notes |
| `#/games` | Private game library |
| `#/games/<gameId>?ply=<n>` | Private replay in the current owner namespace |
| `#/profile/<publicId>` | Published profile |
| `#/profile/<publicId>/games/<publicGameId>?ply=<n>` | Published replay |

Validate IDs before reads and ply bounds after loading the legal history. Private links are not public sharing links. A missing record gives a clear sign-in/missing state without falling back to another account's cache. Keep existing `#/play`, lessons, positions, hints, and review links compatible.

Replay owns its own derived board, selected ply, orientation, and loading state. It must not call live `restoreProgress`, `prepare`, `persist`, or opponent code. Suspend pending live engine/opponent callbacks while replay is open; on Back to game, restore the saved board and safely resume its phase. Persist the original live board before entering replay. Never stamp it newer because replay moved. Public visitors need no private account fetch to view the profile.

### 6. Extend the current visual world

Mode: Operate for import and the owner library; Experience for the public showcase. Preserve the blue/cool-white board, original pieces, graphite shell, jade controls, and existing type. No raster artwork is required.

Add My games and Profile in the existing menu/account area. Import uses a focused dialog: labeled PGN field → legal preview → “I played White / Black” → Save game. Keep errors beside the field and retain input. Show the next action without adding a chat panel. The private profile leads with favorite games and a Paste a game action; style notes sit below in a short disclosure. The public profile leads with the chosen name and featured game rows with board previews, result, and Replay. Do not show a dashboard of scores or achievements.

The signature action is Open finish: a favorite opens at its final board, then Previous move steps back through the finish. Replay has a compact move strip and first/previous/next/last controls. It shares the existing board-size calculation and supports keyboard navigation. Keep replay board and controls within one viewport at 1440×900, 320×568, and 844×390. Profile lists and import details can scroll as secondary surfaces; do not hide missing controls with overflow clipping. Keep dialog focus handling, error announcements, visible labels, and reduced-motion behavior.

Use a small read-only board preview for favorite rows, reusing piece assets without duplicating the live Board component's global square IDs. Scope interactive board IDs to the replay instance if more than one board is mounted. Arrow keys on replay controls navigate moves; board focus retains square navigation.

## Risks / Trade-offs

- **Style is a small sample** → Show sample size and exact observations; suggestions are practice options, not strength diagnoses.
- **Import size and parsing cost** → Enforce limits before parsing, use one main line, and test large/malformed PGNs.
- **Public data can be copied** → Preview the exact public fields and make removal status accurate.
- **Sync races can restore removed data** → Revision checks, tombstones, auth-generation guards, and no publication from sync.
- **Existing routes assume live play** → Add route-dispatch tests before integrating replay; verify pending replies and refresh preservation.
- **Public sharing needs deployed rules** → Gate publishing until matching rules pass tests and are released; private import still works locally.

## Migration Plan

1. Implement additive schemas and isolated local storage; verify old progress remains unchanged.
2. Test private/public Firestore rules and transactions in an emulator, including account changes and stale publication drafts.
3. Deploy additive rules before enabling public writes, then ship the app. Use a separate local test origin and test accounts, never the user's real game.
4. Verify a newly published test profile anonymously, replay its finish, unpublish it, and verify fresh reads no longer return it. Confirm the deployed app version.
5. If rollback is needed, disable new publishing and retain an owner unpublish path; do not remove old progress rules or silently erase private libraries. Existing published profiles remain accessible until explicitly removed. Record this state in HANDOFF.md.
