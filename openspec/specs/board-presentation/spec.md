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
