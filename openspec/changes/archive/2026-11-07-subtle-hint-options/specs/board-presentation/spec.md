## ADDED Requirements

### Requirement: Subtle hint presentation
Hints SHALL use a thin readable arrow with a small arrowhead and light endpoint marks. Only the selected move SHALL have a preview arrow. Hint choices and Play SHALL remain visible with keyboard access and touch targets at supported viewport sizes.

#### Scenario: Compare moves
- **WHEN** the player selects another hint
- **THEN** only its arrow appears and the pieces remain easy to see

#### Scenario: Small viewport
- **WHEN** hints are visible at 320 by 568 or 844 by 390 pixels
- **THEN** the board, options, and Play action fit without document scrolling
