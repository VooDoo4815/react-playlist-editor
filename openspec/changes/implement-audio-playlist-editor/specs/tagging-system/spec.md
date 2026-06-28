## ADDED Requirements

### Requirement: Add tags to tracks
The system SHALL provide tagging functionality for tracks, allowing users to add custom tags to individual tracks.

#### Scenario: Tags added to track
- **WHEN** user adds tags to a track
- **THEN** system associates the tags with that track and displays them in the track metadata

### Requirement: Persist tags locally
The system SHALL persist tags locally within the application so they are available across sessions.

#### Scenario: Application restarted
- **WHEN** user restarts the application
- **THEN** previously added tags are still associated with their respective tracks
