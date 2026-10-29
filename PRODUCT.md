# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Product Purpose
Blunder School teaches chess through play. A coach stays beside the board, offers options, explains mistakes, and lets the player retry.

## Users
People who want to learn chess by playing. V1 is designed for a beginner around rating 350 who repeats mistakes and wants to understand openings and strategy.

## Brand Commitments
Approved name: Blunder School. Approved line: Bad moves. Better chess. Gritty, fun, and focused on learning. Rough print textures, bold type, clear move highlights, and a patient coach.

## Stack
Implementation for the prototype (React was rejected by the user): Svelte and TypeScript, chess.js for rules, and Stockfish Lite in a browser worker. No player account or player API key is needed. The coach uses authored explanations grounded in legal moves and engine lines. An optional server-side Jev decision selects the next skill and teaching action; it does not generate chess explanations.

## Capabilities and Constraints
Playable white-versus-engine games; move suggestions; detected mistakes with retry; practice positions; promotion; legal moves; check, checkmate, and draws. Local progress survives refresh when storage is available. A connected skill graph, guided Italian opening, recurring mistake names, and post-game review support practice. No ratings or live multiplayer. Google login and private Firestore progress are implemented behind a deployment flag pending provider configuration. Guest saves remain local.

## Product Principles
Make a mistake safe to explore. Keep the board primary. Explain concrete consequences. Show honest analysis, not invented praise.
