# Design

## Context
See proposal.md for the player problem. App.svelte derives a chess.js game from a starting FEN and moves; rehearsal boards have only partial history. GameReplay.svelte derives the selected game position. fitBoard measures all board and guide content. No opening classifier exists.

## Goals / Non-Goals
Show an accurate opening family with short text, using existing legal history. Do not turn the label into an opening lesson, change stored games, or add an online dependency during play.

## Decisions
- Bundle an index generated from a pinned commit of lichess-org/chess-openings (CC0). Match full position, turn, castling, and legal en passant rights, excluding move counters. This handles transpositions. A tiny hand-picked move list would miss many ordinary openings; an online lookup would add latency and disclose moves.
- Walk displayed history backwards to the latest known position. Retain that name after moves leave known theory. Show the opening family before the colon, keeping variation text out of the main play surface. Never trust imported PGN opening tags.
- Share a compact OpeningLabel component between live play and replay. Load the data in a separate lazy chunk. Show loading, first-move, unknown, and unavailable states honestly. Keep full text wrapping with the existing measured board layout.
- For rehearsal, join the original history prefix to the displayed preview moves. For arbitrary FEN starts, classify only exact known positions and subsequent history; do not invent earlier moves.
- Saves, account boundaries, assistance credit, and validated routes stay unchanged. The label is derived again after reload and undo.

## Risks / Trade-offs
- Opening names vary by reference → use one pinned, documented source.
- Long family names on small screens → allow wrapping and verify 320×568 and 844×390 as well as desktop.
- Bundled data adds bytes → separate cached lazy chunk; no blocking engine startup.
- Unlisted positions → show Not identified rather than guessing.

## Migration Plan
No data migration. Build and publish the app normally. Rollback restores the prior app; stored games remain compatible.
