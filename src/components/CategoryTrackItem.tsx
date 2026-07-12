import { Box, Checkbox, FormControlLabel, Typography, IconButton, Tooltip, CircularProgress } from '@mui/material'
import { Delete, ErrorOutlined } from '@mui/icons-material'
import type { AudioTrack } from '../types'
import { usePlaylist } from '../contexts/PlaylistContext'
import { formatDuration } from '../utils/format'
import { SeekBar } from './SeekBar'
import { PlayerControls } from './PlayerControls'
import { ContainerSelect } from './ContainerSelect'
import { TagManager } from './TagManager'

interface CategoryTrackItemProps {
  track: AudioTrack
  folderLabel?: string
}

export function CategoryTrackItem({
  track,
  folderLabel,
}: CategoryTrackItemProps) {
  const {
    togglePlaylist,
    deleteTrack,
    playTrack,
    playingTrackId,
    audioCurrentTime,
    seekTrack,
    addTrackTag,
    removeTrackTag,
    updateTrackContainer,
    allContainers,
  } = usePlaylist()
  const isLoading = track.status === 'loading'
  const isError = track.status === 'error'
  const isPlaying = playingTrackId === track.id

  return (
    <Box component="article" sx={{
      p: 1.5, mb: 1, width: '100%',
      backgroundColor: isError ? 'error.light' : isPlaying ? 'action.selected' : 'background.paper',
      borderRadius: 1.5, border: '1px solid',
      borderColor: isError ? 'error.main' : isPlaying ? 'primary.main' : 'divider',
      display: 'flex', flexDirection: 'column', gap: 1,
      opacity: isLoading ? 0.7 : 1,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={track.addedToPlaylist}
              onChange={(e) => togglePlaylist(track.id, e.target.checked)}
              size="small"
              disabled={isLoading}
            />
          }
          label="Playlist"
          sx={{ ml: -0.5 }}
        />

        <Box sx={{ flex: 1, minWidth: 150, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={track.name}>
            <Typography variant="body1" noWrap sx={{ color: 'text.primary', fontWeight: 500 }}>
              {track.name}
            </Typography>
          </Tooltip>
          {isLoading && (
            <CircularProgress size={16} thickness={2} color="primary" />
          )}
          {isError && (
            <Tooltip title="Metadata load failed">
              <ErrorOutlined fontSize="small" color="error" />
            </Tooltip>
          )}
        </Box>

        <Tooltip title="Delete track">
          <IconButton
            size="small"
            onClick={() => deleteTrack(track.id)}
            aria-label={`Delete ${track.name}`}
            color="error"
            disabled={isLoading}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', opacity: isLoading ? 0.5 : 1 }}>
        <Typography variant="caption" color="text.secondary">
          ⏱ {formatDuration(track.duration)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          🎵 BPM: {track.bpm != null ? Math.round(track.bpm) : '--'}
        </Typography>
        {folderLabel && (
          <Typography variant="caption" color="text.secondary">
            📁 {folderLabel}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PlayerControls track={track} isPlaying={isPlaying} onPlay={playTrack} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SeekBar duration={track.duration} currentTime={audioCurrentTime} isPlaying={isPlaying} onSeek={seekTrack} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <ContainerSelect
          trackName={track.name}
          value={track.container}
            onChange={(container) => updateTrackContainer(track.id, container)}
          disabled={isLoading}
          containers={allContainers}
        />

        <TagManager
          tags={track.tags}
            onAdd={(tag) => addTrackTag(track.id, tag)}
            onRemove={(tag) => removeTrackTag(track.id, tag)}
          disabled={isLoading}
        />
      </Box>
    </Box>
  )
}
