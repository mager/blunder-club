## ADDED Requirements

### Requirement: Several sound hint options
The guide SHALL offer up to three unique legal options close to its best available analysis, excluding materially worse moves and preserving known forced mates. It SHALL show fewer options when sufficient sound alternatives are not available. Selecting an option SHALL update the arrow, move notation, and explanation without playing it. Play SHALL use the selected move, including promotion. A selected legal linked hint SHALL remain restorable after reload.

#### Scenario: Several close moves
- **WHEN** analysis has three legal options within 60 centipawns of its best result and no conflicting mate result
- **THEN** the player can preview each option and explicitly play the selected one

#### Scenario: Forced win
- **WHEN** the best line is a forced mate and the other lines lose that mate
- **THEN** only mate-preserving options are suggested

#### Scenario: No padding
- **WHEN** other analyzed moves are materially worse
- **THEN** the guide shows fewer choices instead of presenting weak moves as good options
