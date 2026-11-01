## ADDED Requirements

### Requirement: Concise recovery hints
The app SHALL offer Show hint as the primary recovery action after an incorrect authored lesson attempt. Hints SHALL show a short position-specific cue, a board arrow, and a Play action without automatically making the move.

#### Scenario: Wrong lesson move
- **WHEN** a player makes a legal move that does not meet the lesson goal
- **THEN** the guide shows a short cue and offers Show hint or Try again

#### Scenario: Reveal the hint
- **WHEN** the player chooses Show hint after a wrong attempt
- **THEN** the app restores the lesson position and shows the expected move with its short cue
- **AND** the player can make the move or choose Play

#### Scenario: Detailed explanation
- **WHEN** the player wants the full reason for a hinted move
- **THEN** Why opens the explanation separately from the main board cue
