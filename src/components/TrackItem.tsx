import { Box, Checkbox, FormControlLabel, Typography, IconButton, Tooltip } from '@mui/material'
import { PlayCircleOutlined, Delete } from '@mui/icons-material'
import type { AudioTrack } from '../types'
import { TagManager } from './TagManager'
import { ContainerSelect } from './ContainerSelect'

interface TrackItemProps {
  track: AudioTrack
  onContainerChange: (id: string, container: string | null) => void
  onTagAdd: (id: string, tag: string) => void
  onTagRemove: (id: string, tag: string) => void
  onPlaylistToggle: (id: string, added: boolean) => void
  onDelete: (id: string) => void
  onPlay?: (track: AudioTrack) => void
}

export function TrackItem({
  track,
  onContainerChange,
  onTagAdd,
  onTagRemove,
  onPlaylistToggle,
  onDelete,
  onPlay,
}: TrackItemProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Box
      component="article"
      sx={{
        p: 1.5,
        mb: 1,
        backgroundColor: 'background.paper',
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={track.addedToPlaylist}
              onChange={(e) => onPlaylistToggle(track.id, e.target.checked)}
              size="small"
            />
          }
          label="Playlist"
          sx={{ ml: -0.5 }}
        />

        <Box sx={{ flex: 1, minWidth: 150 }}>
          <Typography variant="body1" noWrap sx={{ color: 'text.primary', fontWeight: 500 }}>
            {track.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              ⏱ {formatDuration(track.duration)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              🎵 BPM: {Math.round(track.bpm)}
            </Typography>
          </Box>
        </Box>

        {onPlay && (
          <Tooltip title="Play">
            <IconButton size="small" onClick={() => onPlay(track)} aria-label={`Play ${track.name}`}>
              <PlayCircleOutlined fontSize="large" color="primary" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <ContainerSelect
          trackName={track.name}
          value={track.container}
          onChange={(container) => onContainerChange(track.id, container)}
        />

        <TagManager
          tags={track.tags}
          availableTags={['chill', 'energetic', 'focus', 'party', 'workout']}
          onAdd={(tag) => onTagAdd(track.id, tag)}
          onRemove={(tag) => onTagRemove(track.id, tag)}
        />

        <Tooltip title="Delete track">
          <IconButton
            size="small"
            onClick={() => onDelete(track.id)}
            aria-label={`Delete ${track.name}`}
            color="error"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}