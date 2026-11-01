## MODIFIED Requirements

### Requirement: Piece identity
The board SHALL use distinct original SVG silhouettes for every piece type and visually separate White and Black on both square colors. White pieces SHALL use a white fill and dark outline; Black pieces SHALL use a dark navy fill. Piece shapes SHALL remain recognizable at phone size.

#### Scenario: Full starting board
- **WHEN** the player starts a new game
- **THEN** all six piece types can be identified for both sides

#### Scenario: Promotion choices
- **WHEN** the promotion dialog opens
- **THEN** the queen, rook, bishop, and knight use the same piece designs as the board

## ADDED Requirements

### Requirement: Blue-and-white board
The board SHALL use blue and cool white squares with readable coordinates, dark hint arrows, warm move highlights, and a distinct check state. The surrounding game layout SHALL remain unchanged.

#### Scenario: Hint on the blue board
- **WHEN** a player requests a hint
- **THEN** the source, destination, and arrow remain visible on both square colors

#### Scenario: King in check
- **WHEN** the king is in check
- **THEN** the king square has a distinct check highlight and its accessible label identifies check
