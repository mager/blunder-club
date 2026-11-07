## ADDED Requirements

### Requirement: Automatic lesson help
An automatic lesson hint SHALL count as help for that run and its evidence SHALL survive reload. Try without hints SHALL suppress automatic hints for the entire new run, including its first position, without changing the saved preference. Manual hints SHALL remain available and count as help.

#### Scenario: Automatic assisted completion
- **WHEN** a player completes a lesson after an automatic hint was shown
- **THEN** completion is recorded as assisted even if the hint was hidden or the page was reloaded

#### Scenario: Independent repeat
- **WHEN** the player chooses Try without hints with automatic hints enabled
- **THEN** no hint is shown automatically in the repeated run and independent credit remains possible
