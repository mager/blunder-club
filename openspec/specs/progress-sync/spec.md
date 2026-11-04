# Progress sync

## Purpose
Local persistence and private Google account progress with explicit conflict handling.

## Requirements

### Requirement: Guest and account isolation
The app SHALL save guest progress locally and SHALL keep account caches separate from guests and other accounts. Google SHALL be the sign-in provider.

#### Scenario: Sign out
- **WHEN** a signed-in player signs out
- **THEN** account progress is not exposed as the next guest save

### Requirement: Safe import and conflicts
The app SHALL import guest progress only after a successful account write and SHALL retain local data when a write fails or another device changes the revision.

#### Scenario: Import fails
- **WHEN** the account import transaction fails
- **THEN** the guest data remains available

#### Scenario: Concurrent edit
- **WHEN** the server revision changes before a write
- **THEN** the local copy remains and the sync reports the conflict

### Requirement: Merge semantics
The app SHALL choose the newer board, merge counters with maximum values, retain relevant practice evidence, and honor lesson deletion timestamps.

#### Scenario: Same import twice
- **WHEN** the same completion data is merged twice
- **THEN** the counters do not increase twice

#### Scenario: Old deleted lesson
- **WHEN** an older device sends a lesson removed more recently
- **THEN** the removed lesson is not restored

### Requirement: Save validation
The app SHALL validate stored move history and study records while preserving valid learning data when a board is damaged.

#### Scenario: Damaged moves
- **WHEN** stored moves are illegal
- **THEN** the app restores a playable board and retains valid saved lessons

#### Scenario: Real timestamp
- **WHEN** a study completion has a valid epoch timestamp
- **THEN** normalization preserves that timestamp

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
