# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Product Purpose
Nextmove is a learning site that teaches chess through play. A coach stays beside the board, offers options, explains mistakes, and lets the player retry.

## Users
People who want to learn chess by playing. V1 is designed for a beginner around rating 350 who repeats mistakes and wants to understand openings and strategy.

## Brand Commitments
Approved name: Nextmove. A board-first learning game. The player learns by making decisions, seeing consequences, and retrying. Keep the coach concise. Board, guide, and main controls must fit one window without page scrolling; longer explanations open in a focused panel. No welcome hero, slogans, or lesson dashboard in the play area.

## Stack
Implementation for the prototype (React was rejected by the user): Svelte and TypeScript, chess.js for rules, and Stockfish Lite in a browser worker. No player account or player API key is needed. The coach uses authored explanations grounded in legal moves and engine lines. An optional server-side Jev decision selects the next skill and teaching action; it does not generate chess explanations.

## Capabilities and Constraints
Playable games as White against Casual, Club, and Challenge opponents; pre-move warnings, after-move coaching, or uninterrupted games with an end review; isolated board rehearsals; move suggestions; detected mistakes with retry; personal practice sessions with checked moves, assisted/independent results, and safe return to the original game; practice positions; promotion; legal moves; check, checkmate, and draws. Local progress survives refresh when storage is available. A connected skill graph, three guided openings and 22 authored challenges, recurring mistake names, and post-game review support practice. No ratings or live multiplayer. Google login and private Firestore progress are enabled in production. Guest saves remain local.

## Product Principles
Make a mistake safe to explore. Keep the board primary. Explain concrete consequences. Show honest analysis, not invented praise.

## Journey and revisitable play

The header opens a connected six-place journey. Saved practice evidence distinguishes exploration, assisted solutions, and positions solved without help. All places are available; no mastery claim or invented progression. Each selected place and meaningful board view has a bookmarkable hash URL. Ask Rook is removed; direct hints, threat checks, and optional move explanations remain.

## Board appearance
The board uses blue and cool white squares with original white and navy SVG pieces. Classic silhouettes distinguish each piece, with a taller, broader king and a large cross. The user requested a familiar chess.com-like chess surface; the surrounding graphite shell and jade controls remain.

## Authored lesson extension
A compact lesson picker opens from Practice or a journey place. It filters by chess skill and separates openings from challenges. The board keeps one short task at a time. Scripted replies support multi-move tactics and openings. Completion offers a next lesson, a repeat without hints, or continued play from a nonterminal board. Saved results distinguish assisted and independent completion; they do not imply mastery. All lessons have stable URLs.

### Starting again
New game is visible above a normal game board. Authored lessons show Start over in the same place. A dialog confirms the reset and offers Keep playing. Resetting retains learning results and saved practice positions. Personal practice retains Back to game.

### Help when stuck
After a wrong authored attempt, show one short position-specific cue with Show hint and Try again. Show hint restores the board and reveals an arrow plus Play. Full reasons stay behind Why. Personal practice also offers direct hint recovery. Avoid generic hints and extra paragraphs.

## Imported games and favorite profiles

My games opens from the game menu; Profile and Paste a game also open from the account panel. Players can paste one standard-chess PGN, check its main line, choose White or Black, and save it in a private library. Comments, variations, and imported grading marks do not become Nextmove analysis. The library supports titles, favorites, removal, and isolated replay from either side. Open finish jumps to the final board. Replay and refresh keep the original playable game and lesson assistance evidence safe.

Private style notes count the chosen side's first moves, checks, captures, and castling, with source-game links and sample sizes. After at least three eligible games, stated pattern rules can suggest an existing castling, Italian, or Queen's Gambit lesson. Notes do not measure strength or claim a fixed style. Imports grant no lesson credit.

Guests keep up to 100 games on their device. Google accounts sync private game records separately from progress, with revision conflicts, deletion records, and retryable transfers. Public sharing requires a chosen public name and an explicit preview/publish action. A profile can feature up to eight selected favorites. Visitors can replay those games without signing in. Public copies contain only the chosen name, titles, player names, sides, results, starting positions, and moves. Style notes and Google identity stay private. Unpublish removes the public page; removing a featured game removes its public copy when cloud sync succeeds.

## Opening names during play

Live games, lessons, and saved or public replay show the latest recognized opening family above the board. Names come from a bundled opening reference and follow the displayed move history, including undo, rehearsal, and reload. The label retains the last known name as play continues. A standard starting board says Play the first move; an unrecognized position says Not identified. This context gives no lesson credit and does not infer missing history from a custom board.

## Automatic hints

Move hints start on. A ready player turn shows a suggested move with its arrow and Play action. Coach settings has a saved Automatic hints switch. Hide hint or selecting a piece hides it for that turn; the next prepared position can show a new hint. Manual hints remain available. Automatic hints stay off during an attempt started with Try without hints and during free play with After the game coaching. Displayed automatic hints count as help, and lesson assistance survives reload. Hints never play a move automatically.

## Move options

Hints use a thin arrow and light endpoint marks. The guide offers up to three legal moves close to its best available analysis, with known forced mates preserved. It shows fewer choices when the alternatives are weak. Selecting a move updates the preview and Play action without making a move. Lessons offer only authored accepted alternatives or legal checkmates when mate is the goal. The selected move and assistance evidence survive reload.
