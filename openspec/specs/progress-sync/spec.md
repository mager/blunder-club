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
