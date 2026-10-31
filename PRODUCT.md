# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Product Purpose
Nextmove teaches chess through play. A coach stays beside the board, offers options, explains mistakes, and lets the player retry.

## Users
People who want to learn chess by playing. V1 is designed for a beginner around rating 350 who repeats mistakes and wants to understand openings and strategy.

## Brand Commitments
Approved name: Nextmove. A board-first learning game. The player learns by making decisions, seeing consequences, and retrying. Keep the coach concise. Board, guide, and main controls must fit one window without page scrolling; longer explanations open in a focused panel. No welcome hero, slogans, or lesson dashboard in the play area.

## Stack
Implementation for the prototype (React was rejected by the user): Svelte and TypeScript, chess.js for rules, and Stockfish Lite in a browser worker. No player account or player API key is needed. The coach uses authored explanations grounded in legal moves and engine lines. An optional server-side Jev decision selects the next skill and teaching action; it does not generate chess explanations.

## Capabilities and Constraints
Playable games as White against Casual, Club, and Challenge opponents; pre-move warnings, after-move coaching, or uninterrupted games with an end review; isolated board rehearsals; move suggestions; detected mistakes with retry; personal practice sessions with checked moves, assisted/independent results, and safe return to the original game; practice positions; promotion; legal moves; check, checkmate, and draws. Local progress survives refresh when storage is available. A connected skill graph, guided Italian opening, recurring mistake names, and post-game review support practice. No ratings or live multiplayer. Google login and private Firestore progress are enabled in production. Guest saves remain local.

## Product Principles
Make a mistake safe to explore. Keep the board primary. Explain concrete consequences. Show honest analysis, not invented praise.

## Journey and revisitable play

The header opens a connected six-place journey. Saved practice evidence distinguishes exploration, assisted solutions, and positions solved without help. All places are available; no mastery claim or invented progression. Each selected place and meaningful board view has a bookmarkable hash URL. Ask Rook is removed; direct hints, threat checks, and optional move explanations remain.
