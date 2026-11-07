## ADDED Requirements

### Requirement: Visible opening name
Game and replay pages SHALL show a short opening name from the latest recognized position in the displayed history. Names SHALL come from a bundled reference, including matching positions reached by different move orders. The name SHALL remain visible after later moves leave the reference.

#### Scenario: Opening becomes specific
- **WHEN** play reaches the Italian Game position
- **THEN** the visible opening name is Italian Game

#### Scenario: Unusual reply
- **WHEN** a game starts with d4, a5, e4, and Nc6
- **THEN** the opening label shows Ware Defense from the recognized position

#### Scenario: Undo and revisit
- **WHEN** a player undoes moves, reloads a game link, or changes a replay or rehearsal stage
- **THEN** the opening label reflects only that displayed history

### Requirement: Honest opening context
The opening label SHALL distinguish a standard starting board from an unrecognized position and SHALL NOT infer missing opening history from a custom starting position or imported metadata. Loading or unavailable reference data SHALL NOT block play. The full label, board, guide, and primary controls SHALL fit the viewport.

#### Scenario: No first move
- **WHEN** a standard game has no moves
- **THEN** the label asks the player to play the first move

#### Scenario: Arbitrary practice board
- **WHEN** a custom starting position and its displayed moves have no reference match
- **THEN** the label says the opening is not identified

#### Scenario: Phone and short landscape
- **WHEN** the label is viewed at 320 by 568 or 844 by 390 pixels
- **THEN** its name wraps if needed without clipping controls or causing document scrolling
