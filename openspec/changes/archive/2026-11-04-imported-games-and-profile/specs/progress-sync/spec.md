## ADDED Requirements

### Requirement: Isolated game library
Imported games SHALL use bounded storage separate from active-board progress. Guest and account libraries SHALL remain isolated. Old saves SHALL load with an empty library without changing the saved board or learning evidence. Invalid game records SHALL NOT prevent valid games or progress from loading.

#### Scenario: Old save
- **WHEN** a player loads a save made before game import was added
- **THEN** the current game and practice evidence remain intact and the new library starts empty

#### Scenario: Account switch
- **WHEN** a player signs out or changes accounts during a library request
- **THEN** the new session cannot display or save the previous account's private library or style notes
- **AND** late request results from the previous account are discarded

### Requirement: Safe game transfer and merge
Guest game transfer SHALL be retryable and SHALL remove each local guest record only after its matching account write succeeds. Library merges SHALL avoid duplicate games and honor deletion records and revision conflicts. Failed writes SHALL keep a local copy and a visible retry state.

#### Scenario: Partial transfer
- **WHEN** two guest games transfer successfully and a third write fails
- **THEN** the third guest game remains available and retry does not duplicate the first two

#### Scenario: Stale edit after deletion
- **WHEN** another device uploads an older copy of a deleted game
- **THEN** the game remains deleted and contributes no style evidence

#### Scenario: Storage limit
- **WHEN** an import exceeds the stated library limit or the device cannot store it
- **THEN** the app explains the limit or save failure, retains the input, and does not report a successful save

### Requirement: Separate public projection
Public profile reads SHALL access only the deliberately published projection. Private progress, private game records, and profile ownership records SHALL remain owner-only. Public writes SHALL require the owner and valid bounded fields. Private sync SHALL NOT publish profile data.

#### Scenario: Anonymous access
- **WHEN** an anonymous visitor reads a published profile
- **THEN** the visitor can read the public projection and cannot read private game, progress, or ownership documents

#### Scenario: Unauthorized update
- **WHEN** another account attempts to update or delete a player's public profile
- **THEN** the write is rejected
