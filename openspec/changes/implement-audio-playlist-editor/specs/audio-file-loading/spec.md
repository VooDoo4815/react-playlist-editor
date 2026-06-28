## ADDED Requirements

### Requirement: Load audio files from local disk
The system SHALL allow users to select and load audio files from their local disk folders. The system SHALL support common audio formats including MP3 and FLAC.

#### Scenario: User selects folder with audio files
- **WHEN** user selects a folder containing audio files
- **THEN** system loads all supported audio files from that folder and subfolders

#### Scenario: User selects folder with mixed file types
- **WHEN** user selects a folder containing both audio and non-audio files
- **THEN** system loads only supported audio files and ignores other file types

### Requirement: Display file metadata
The system SHALL display metadata for each loaded audio file including source folder, duration, and filename.

#### Scenario: Audio files loaded successfully
- **WHEN** audio files are loaded from disk
- **THEN** system displays source folder, duration, and filename for each track
