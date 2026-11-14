## ADDED Requirements

### Requirement: Save a played Nextmove game
Players SHALL be able to save a normal Nextmove game's legal history to their private game library from the game menu and completion view. The save SHALL preserve the active game and learning evidence. It SHALL use the real game, not a rehearsal, and SHALL label the opponent honestly. Authored lesson and personal-practice attempts SHALL NOT use this action.

#### Scenario: Save and feature a finished game
- **WHEN** a player saves a completed Nextmove game
- **THEN** the library can replay every move and the final result
- **AND** the player can favorite it and select it for an explicit profile preview and publication

#### Scenario: Save an unfinished game twice
- **WHEN** a player saves the same unfinished history twice
- **THEN** one private library record remains with an unfinished result and its existing title and favorite choice
- **AND** the original playable game stays available

#### Scenario: Empty game or removed snapshot
- **WHEN** a player has no moves or tries to save a snapshot they previously removed
- **THEN** the app does not silently add or restore a library record

#### Scenario: Account changes during save
- **WHEN** an account changes before an asynchronous save finishes
- **THEN** the result cannot appear in or be written to the next account's library

#### Scenario: Save fails
- **WHEN** storage fails or the library limit is reached
- **THEN** the dialog keeps the game available, reports the error, and does not report a successful save
