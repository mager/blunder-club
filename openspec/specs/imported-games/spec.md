# imported-games Specification

## Purpose
Let players save games from other chess sites, replay them, and use measured move patterns to choose further practice.

## Requirements

### Requirement: Validated PGN import
The app SHALL accept one standard-chess PGN main line with optional headers, comments, numeric annotations, and variations. It SHALL validate every main-line move, show player names and result for review, and require the player to choose White or Black before saving. It SHALL ignore variation moves and imported grading marks for style evidence.

#### Scenario: Annotated mating game
- **WHEN** the supplied 36-move game with numeric annotations is imported
- **THEN** the preview contains 71 legal half-moves and ends at checkmate after h4, with result 1-0
- **AND** the player can select White and save the game without changing the active board

#### Scenario: Invalid or unsupported input
- **WHEN** the input has an illegal main-line move, multiple games, an unsupported variant, no moves, or exceeds the stated import limit
- **THEN** the app gives a specific error, retains the pasted text, and saves no partial game

#### Scenario: Result conflict
- **WHEN** a result header conflicts with the move-text result or a forced board result
- **THEN** the app identifies the conflict before saving and requires corrected input

#### Scenario: Custom start
- **WHEN** a standard-chess game has valid SetUp and FEN headers
- **THEN** replay uses that starting position, including its side to move and move number
- **AND** opening-style metrics exclude this game

### Requirement: Private library and replay
The app SHALL let players title, favorite, remove, and replay saved games from either side. Replay SHALL support the start, previous move, next move, finish, and a selected half-move. It SHALL preserve the active game's board, lesson state, help evidence, and pending learning results, including after reload.

#### Scenario: Replay as Black
- **WHEN** a player opens an imported game saved as Black
- **THEN** the replay initially faces Black, supports every legal half-move, and does not start an opponent reply
- **AND** Back to game restores the original active game

#### Scenario: Duplicate import
- **WHEN** the same game is pasted again with different spacing, comments, or grading marks
- **THEN** the app opens the existing record without adding a second game or counting its moves again

### Requirement: Inspectable style evidence
Style notes SHALL use only the selected player's legal moves and SHALL show the sample size and source games. The app SHALL show first-move choices, castling observations, and checks and captures per player move. It SHALL separate move facts from playing strength and SHALL NOT derive error claims from imported annotations, ratings, or the game result.

#### Scenario: One game
- **WHEN** the library contains only the supplied game saved as White
- **THEN** notes show one game, a d4 first move, castling on move 9, and 10 checking moves including mate across 36 White moves
- **AND** the notes do not claim a stable style or a measured skill level

#### Scenario: Corrected side or deleted source
- **WHEN** the player corrects their side or removes a game
- **THEN** all private aggregates and lesson suggestions are recalculated from the remaining selected-side evidence

### Requirement: Practice suggestions from repeated patterns
After at least three distinct eligible games, the app SHALL offer at most one existing lesson suggestion from a documented repeated-pattern rule. It SHALL state the supporting count and allow the player to open its source games. A suggestion SHALL NOT change the opponent, award progress, or claim the player made an engine-verified mistake.

#### Scenario: Repeated opening choice
- **WHEN** at least three eligible White games repeatedly open with e4 and satisfy the defined opening rule
- **THEN** the app can offer the existing Italian lesson with the exact supporting game count
- **AND** other lessons remain available

#### Scenario: Insufficient or unmatched evidence
- **WHEN** fewer than three eligible games exist or no rule matches
- **THEN** the app shows the measured facts without inventing a personal lesson recommendation

#### Scenario: Lesson after import
- **WHEN** the player starts a suggested authored lesson
- **THEN** the normal authored acceptance and assistance rules apply
- **AND** importing, replaying, or favoriting the source game grants no completion credit
