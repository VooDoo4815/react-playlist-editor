## Why

There is a need for a browser-based audio playlist editor that allows users to organize, categorize, and export audio tracks without requiring a server. The application should support loading tracks from local folders, analyzing BPM in-browser, and providing advanced playlist management features including custom containers, tagging, and duplicate handling.

## What Changes

- Implement a complete browser-based audio playlist editor application
- Add support for loading audio tracks from local disk folders
- Implement in-browser BPM analysis for audio tracks
- Create UI for organizing tracks into categories and custom containers
- Add tagging functionality for tracks
- Implement drag-and-drop functionality for moving tracks between categories and containers
- Add playback functionality for audio files
- Implement playlist export functionality in M3U8, XSPF, and JSON formats
- Add persistence of app state and categories locally

## Capabilities

### New Capabilities
- `audio-file-loading`: Support loading audio tracks from local disk folders in common formats (MP3, FLAC, etc.)
- `bpm-analysis`: In-browser BPM analysis for audio tracks using Web Audio API
- `track-categorization`: Organize tracks into categories based on folder structure and custom containers
- `tagging-system`: Allow users to add and manage tags for tracks
- `drag-and-drop`: Enable drag-and-drop functionality for moving tracks between categories and containers
- `audio-playback`: Provide playback functionality for audio files within the browser
- `playlist-export`: Export playlists in M3U8, XSPF, and JSON formats with proper encoding and path handling
- `local-persistence`: Persist app state, categories, and tags locally within the browser

### Modified Capabilities
- None

## Impact

- New React-based frontend application
- Integration with browser File System Access API for local file access
- Implementation of Web Audio API for BPM analysis
- Local storage usage for persistence
- No backend/server requirements
- Potential performance considerations for large audio collections
