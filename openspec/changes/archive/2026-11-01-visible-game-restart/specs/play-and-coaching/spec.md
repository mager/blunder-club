## ADDED Requirements

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
