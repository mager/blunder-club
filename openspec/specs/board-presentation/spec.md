# Board presentation

## Purpose
Readable pieces and board states in a single-screen play surface.

## Requirements

### Requirement: Board-led surface
The board, guide, and main play controls SHALL fit the visible viewport without page scrolling. Secondary dialogs MAY scroll for longer lists and explanations.

#### Scenario: Small phone
- **WHEN** the player opens a lesson at 320 by 568 pixels
- **THEN** the board, cue, and primary decision controls remain visible

### Requirement: Piece identity
The board SHALL use distinct original SVG silhouettes for every piece type and visually separate White and Black on both square colors. White pieces SHALL use a white fill and dark outline; Black pieces SHALL use a dark navy fill. Piece shapes SHALL remain recognizable at phone size.

#### Scenario: Full starting board
- **WHEN** the player starts a new game
- **THEN** all six piece types can be identified for both sides

#### Scenario: Promotion choices
- **WHEN** the promotion dialog opens
- **THEN** the queen, rook, bishop, and knight use the same piece designs as the board

### Requirement: Board state visibility
The board SHALL distinguish selected squares, legal destinations, captures, last moves, hint arrows, and a king in check without changing chess state.

#### Scenario: Hint request
- **WHEN** the player requests a hint
- **THEN** an arrow marks the source and destination while the played game stays unchanged

### Requirement: Keyboard and motion
The board SHALL retain square names, arrow-key focus navigation, Enter selection, and reduced-motion support.

#### Scenario: Reduced motion
- **WHEN** the player has reduced motion enabled
- **THEN** move changes occur without the animated glide

### Requirement: Blue-and-white board
The board SHALL use blue and cool white squares with readable coordinates, dark hint arrows, warm move highlights, and a distinct check state. The surrounding game layout SHALL remain unchanged.

#### Scenario: Hint on the blue board
- **WHEN** a player requests a hint
- **THEN** the source, destination, and arrow remain visible on both square colors

#### Scenario: King in check
- **WHEN** the king is in check
- **THEN** the king square has a distinct check highlight and its accessible label identifies check

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
