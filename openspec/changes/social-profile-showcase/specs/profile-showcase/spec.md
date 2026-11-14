## ADDED Requirements

### Requirement: Chosen profile identity and stories
The owner SHALL be able to publish an optional bio, a chosen original chess-piece avatar, one spotlight game, and optional stories for selected games. Bio and stories SHALL be at most 160 plain-text characters each. Spotlight and stories SHALL refer only to published games. These fields SHALL appear in the exact preview before publication.

#### Scenario: Personal collection
- **WHEN** an owner previews a chosen name, bio, avatar, spotlight, and game stories
- **THEN** the preview shows exactly those public fields and selected games
- **AND** publishing uses the preview contents without Google identity or private learning records

#### Scenario: Existing profile
- **WHEN** a visitor opens an older profile without personal details
- **THEN** its name, games, and replay links still work with a default original chess-piece avatar

#### Scenario: Unsafe or oversized details
- **WHEN** a write includes unknown identity fields, oversized text, an unsupported avatar, or a story for an unselected game
- **THEN** the write is rejected and the last published profile remains unchanged

#### Scenario: Remove the spotlight
- **WHEN** a published spotlight game is deleted or unfavorited and cloud sync succeeds
- **THEN** its public game, story, and spotlight selection are removed together

### Requirement: Share a profile or game
A public profile SHALL show its chosen spotlight before the remaining collection and SHALL offer links for the profile and each game's finish. A clipboard failure SHALL show a selectable link. Preview sharing SHALL remain disabled until publication. The public page SHALL remain usable with keyboard input and at 320 pixels wide.

#### Scenario: Share a finish
- **WHEN** a visitor copies a selected game's link
- **THEN** the link opens that published game's final legal position without sign-in
- **AND** the recipient can replay earlier moves without changing their own saved game

#### Scenario: Clipboard denied
- **WHEN** the browser denies clipboard access
- **THEN** the page shows the correct selectable link without claiming it was copied
