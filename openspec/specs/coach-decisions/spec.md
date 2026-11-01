# Coach decisions

## Purpose
Optional model choices that do not replace chess legality or authored explanations.

## Requirements

### Requirement: Bounded model role
Jev SHALL select a skill and teaching action from allowed choices based on supplied engine evidence. It SHALL NOT supply the chess legality authority or free-form chess explanations.

#### Scenario: Valid confident choice
- **WHEN** Jev returns an allowed skill with sufficient confidence
- **THEN** the app may use that teaching choice

### Requirement: Validated server boundary
The optional API SHALL validate bounded chess evidence before a paid request and SHALL keep its API key server-side.

#### Scenario: Illegal evidence
- **WHEN** a request contains an illegal move
- **THEN** the API rejects it before calling the provider

### Requirement: Local fallback
The coach SHALL continue with local teaching rules when the provider is absent, fails, or returns insufficient confidence.

#### Scenario: Provider failure
- **WHEN** Jev times out or is unavailable
- **THEN** the coach uses the local fallback rather than claiming successful model analysis
