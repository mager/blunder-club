## ADDED Requirements

### Requirement: Automatic hints
Automatic hints SHALL default to on and SHALL have a saved on/off control in Coach settings. Each ready player turn SHALL show the existing legal hint arrow and Play action when enabled. Hints SHALL NOT make a move automatically or appear during analysis, warnings, review, promotion, terminal states, or free-play after-game coaching. Manual hints SHALL remain available.

#### Scenario: Default guidance
- **WHEN** a player opens a game with no saved hint preference and analysis finishes
- **THEN** the current move suggestion appears with its Play action

#### Scenario: Saved opt-out
- **WHEN** the player turns Automatic hints off and reloads
- **THEN** automatic suggestions stay off and manual Hint remains available

#### Scenario: Hide for this turn
- **WHEN** the player hides a hint or selects a piece
- **THEN** the suggestion stays hidden for that prepared turn
- **AND** automatic hints resume when the next position is prepared
