# Proposal

## Why
Nextmove is a learning site, but game pages do not name the opening. Keep the name visible so players learn during ordinary play.

## What Changes
- Show a compact opening name in live games, lessons, and saved/public game replay.
- Match known positions from a bundled, licensed opening dataset. Retain the latest known opening after later moves; update on undo, replay, and reload.
- Give honest starting and unknown states. Do not infer an opening from an arbitrary practice position.
- State the learning-site purpose explicitly in AGENTS.md and document the label.
- No new lesson curriculum, network lookup during play, accounts, or grading.

## Capabilities
### New Capabilities
None.
### Modified Capabilities
- `board-presentation`: visible opening context for the displayed game history.

## Impact
Svelte game/replay UI, a shared position matcher, bundled CC0 data and generation script, tests, and project documentation. No save schema or URL changes.
