# Play and coaching

## Purpose
Legal chess play with separate opponent strength and teaching analysis.

## Requirements

### Requirement: Legal games
The game SHALL let the player play White without a clock and SHALL use chess.js for legal moves and terminal results.

#### Scenario: Special moves
- **WHEN** a legal move requires promotion
- **THEN** the player can choose queen, rook, bishop, or knight

#### Scenario: Completed game
- **WHEN** the board reaches checkmate or a draw
- **THEN** the app displays the result and stops normal moves

### Requirement: Separate opponent and teaching strength
The game SHALL offer Casual, Club, and Challenge opponents while retaining Stockfish analysis for teaching.

#### Scenario: Casual play
- **WHEN** the player selects Casual
- **THEN** the opponent uses bounded shallow play without claiming an Elo rating

#### Scenario: Challenge play
- **WHEN** the player selects Challenge
- **THEN** the opponent uses the engine recommendation

### Requirement: Useful warnings
The coach SHALL support before-move warnings, after-move coaching, and review after the game. It SHALL NOT warn against its own recommended move.

#### Scenario: Recommended move
- **WHEN** the player chooses the suggested best move and a later search changes its score
- **THEN** the app does not warn against that move

#### Scenario: Warning choice
- **WHEN** a meaningful new mistake is previewed in warning mode
- **THEN** the player can request a move, play anyway, or pause warnings

#### Scenario: Already lost position
- **WHEN** the position already has a forced loss and the reply preserves that loss
- **THEN** the app does not treat the existing forced loss as a new warning

### Requirement: Isolated board rehearsal
The app SHALL keep Before, Your move, and Their reply previews separate from played history and saved game state.

#### Scenario: Explore a reply
- **WHEN** the player changes rehearsal stages
- **THEN** only the preview board changes

### Requirement: Evidence-based review
The app SHALL show important evaluation changes after review and offer replay or practice of a turning point without claiming a proven single cause of defeat.

#### Scenario: Review a loss
- **WHEN** analysis finds a material evaluation drop
- **THEN** the player can inspect the move and the opponent reply

### Requirement: Visible game reset
The app SHALL show New game above a normal game board and Start over above an authored lesson. It SHALL ask the player to confirm before replacing the board, and SHALL preserve learning results and saved positions.

#### Scenario: Cancel reset
- **WHEN** a player opens New game and chooses Keep playing or closes the dialog
- **THEN** the current game remains available with its moves intact

#### Scenario: Restart lesson
- **WHEN** a player confirms Start over in an authored lesson
- **THEN** that lesson returns to its first position with a fresh attempt and retains previous learning results

#### Scenario: New full game
- **WHEN** a player confirms New game
- **THEN** the app opens the standard starting board and cancels stale analysis from the previous board
