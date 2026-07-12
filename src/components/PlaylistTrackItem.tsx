import { useState, type ReactNode } from 'react'
import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import { ArrowUpward, ArrowDownward, ExpandMore, ExpandLess } from '@mui/icons-material'
import type { AudioTrack } from '../types'
import { usePlaylist } from '../contexts/PlaylistContext'
import { SeekBar } from './SeekBar'
import { PlayerControls } from './PlayerControls'
import { TagManager } from './TagManager'
import { ContainerSelect } from './ContainerSelect'

interface PlaylistTrackItemProps {
  track: AudioTrack
  folderLabel?: string
  onMoveUp?: () => void
  onMoveDown?: () => void
  actionButton: ReactNode
}

export function PlaylistTrackItem({
  track,
  folderLabel,
  onMoveUp,
  onMoveDown,
  actionButton,
}: PlaylistTrackItemProps) {
  const {
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
  const isPlaying = playingTrackId === track.id
  const [expanded, setExpanded] = useState(false)

  return (
    <Box component="article" sx={{
      p: 1.5, mb: 1, width: '100%',
      backgroundColor: isPlaying ? 'action.selected' : 'background.paper',
      borderRadius: 1.5, border: '1px solid',
      borderColor: isPlaying ? 'primary.main' : 'divider',
      display: 'flex', flexDirection: 'column', gap: 1,
      opacity: isLoading ? 0.7 : 1,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={track.name}>
          <Typography variant="body1" noWrap sx={{ flex: 1, fontWeight: 500, color: 'text.primary' }}>
            {track.name}
          </Typography>
        </Tooltip>
        {onMoveUp && (
          <Tooltip title="Move up">
            <IconButton size="small" onClick={onMoveUp} aria-label={`Move ${track.name} up`}>
              <ArrowUpward fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onMoveDown && (
          <Tooltip title="Move down">
            <IconButton size="small" onClick={onMoveDown} aria-label={`Move ${track.name} down`}>
              <ArrowDownward fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {actionButton}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', opacity: isLoading ? 0.5 : 1 }}>
        {folderLabel && (
          <Typography variant="caption" color="text.secondary">📁 {folderLabel}</Typography>
        )}
        <Typography variant="caption" color="text.secondary">🎵 BPM: {track.bpm != null ? Math.round(track.bpm) : '--'}</Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PlayerControls track={track} isPlaying={isPlaying} onPlay={playTrack} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SeekBar duration={track.duration} currentTime={audioCurrentTime} isPlaying={isPlaying} onSeek={seekTrack} />
        </Box>
        <Tooltip title={expanded ? 'Hide details' : 'Show details'}>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Tooltip>
      </Box>

      {expanded && (
        <>
          <TagManager
            tags={track.tags}
            onAdd={(tag) => addTrackTag(track.id, tag)}
            onRemove={(tag) => removeTrackTag(track.id, tag)}
            disabled={isLoading}
          />
          <ContainerSelect
            trackName={track.name}
            value={track.container}
            onChange={(container) => updateTrackContainer(track.id, container)}
            disabled={isLoading}
            containers={allContainers}
          />
        </>
      )}
    </Box>
  )
}
