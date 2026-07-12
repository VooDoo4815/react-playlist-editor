import { useState } from 'react'
import { Box, Checkbox, FormControlLabel, Typography, IconButton, Tooltip, CircularProgress, Slider } from '@mui/material'
import { PlayCircleOutlined, StopCircle, Delete, ErrorOutlined, RemoveCircleOutlined, ArrowUpward, ArrowDownward, ExpandMore, ExpandLess } from '@mui/icons-material'
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
  playingTrackId?: string | null
  audioCurrentTime?: number
  onSeek?: (time: number) => void
  folderLabel?: string
  variant?: 'category' | 'playlist' | 'container'
  containers?: readonly string[]
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export function TrackItem({
  track,
  onContainerChange,
  onTagAdd,
  onTagRemove,
  onPlaylistToggle,
  onDelete,
  onPlay,
  playingTrackId,
  audioCurrentTime = 0,
  onSeek,
  folderLabel,
  variant = 'category',
  containers,
  onMoveUp,
  onMoveDown,
}: TrackItemProps) {
  const formatDuration = (seconds: number | null) => {
    if (seconds == null) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isLoading = track.status === 'loading'
  const isError = track.status === 'error'
  const isPlaying = playingTrackId === track.id
  const [expanded, setExpanded] = useState(false)

  const cardSx = {
    p: 1.5,
    mb: 1,
    width: '100%',
    backgroundColor: isError ? 'error.light' : isPlaying ? 'action.selected' : 'background.paper',
    borderRadius: 1.5,
    border: '1px solid',
    borderColor: isError ? 'error.main' : isPlaying ? 'primary.main' : 'divider',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    opacity: isLoading ? 0.7 : 1,
  } as const

  const seekBar =
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 28,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, textAlign: 'right' }}>
        {isPlaying ? formatDuration(audioCurrentTime): null}
      </Typography>
      <Slider
        size="small"
        value={isPlaying ? audioCurrentTime : undefined}
        min={0}
        max={track.duration || 0}
        step={0.1}
        onChange={(_, value) => onSeek?.(value as number)}
        sx={{ flex: 1, py: 0 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
        {formatDuration(track.duration)}
      </Typography>
    </Box>;

  const playerButtons = onPlay && track.url && !isLoading && !isError ? (
    isPlaying ? (
      <Tooltip title="Stop">
        <IconButton size="small" onClick={() => onPlay(track)} aria-label={`Stop ${track.name}`}>
          <StopCircle color="primary" />
        </IconButton>
      </Tooltip>
    ) : (
      <Tooltip title="Play">
        <IconButton size="small" onClick={() => onPlay(track)} aria-label={`Play ${track.name}`}>
          <PlayCircleOutlined color="primary" />
        </IconButton>
      </Tooltip>
    )
  ) : null

  if (variant === 'playlist') {
    return (
      <Box component="article" sx={cardSx}>
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

          <Tooltip title="Remove from playlist">
            <IconButton
              size="small"
              onClick={() => onPlaylistToggle(track.id, false)}
              aria-label={`Remove ${track.name} from playlist`}
              disabled={isLoading}
            >
              <RemoveCircleOutlined color="action" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', opacity: isLoading ? 0.5 : 1 }}>
          {folderLabel && (
            <Typography variant="caption" color="text.secondary">📁 {folderLabel}</Typography>
          )}
          <Typography variant="caption" color="text.secondary">🎵 BPM: {track.bpm != null ? Math.round(track.bpm) : '--'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {playerButtons}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {seekBar}
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
              availableTags={['chill', 'energetic', 'focus', 'party', 'workout']}
              onAdd={(tag) => onTagAdd(track.id, tag)}
              onRemove={(tag) => onTagRemove(track.id, tag)}
              disabled={isLoading}
            />

            <ContainerSelect
              trackName={track.name}
              value={track.container}
              onChange={(container) => onContainerChange(track.id, container)}
              disabled={isLoading}
              containers={containers}
            />
          </>
        )}
      </Box>
    )
  }

  if (variant === 'container') {
    return (
      <Box component="article" sx={cardSx}>
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

          <Tooltip title="Remove from container">
            <IconButton
              size="small"
              onClick={() => onContainerChange(track.id, null)}
              aria-label={`Remove ${track.name} from container`}
              disabled={isLoading}
            >
              <RemoveCircleOutlined color="action" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', opacity: isLoading ? 0.5 : 1 }}>
          {folderLabel && (
            <Typography variant="caption" color="text.secondary">📁 {folderLabel}</Typography>
          )}
          <Typography variant="caption" color="text.secondary">🎵 BPM: {track.bpm != null ? Math.round(track.bpm) : '--'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {playerButtons}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {seekBar}
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
              availableTags={['chill', 'energetic', 'focus', 'party', 'workout']}
              onAdd={(tag) => onTagAdd(track.id, tag)}
              onRemove={(tag) => onTagRemove(track.id, tag)}
              disabled={isLoading}
            />

            <ContainerSelect
              trackName={track.name}
              value={track.container}
              onChange={(container) => onContainerChange(track.id, container)}
              disabled={isLoading}
              containers={containers}
            />
          </>
        )}
      </Box>
    )
  }

  return (
    <Box component="article" sx={cardSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={track.addedToPlaylist}
              onChange={(e) => onPlaylistToggle(track.id, e.target.checked)}
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
            onClick={() => onDelete(track.id)}
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
        {playerButtons}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {seekBar}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <ContainerSelect
          trackName={track.name}
          value={track.container}
          onChange={(container) => onContainerChange(track.id, container)}
          disabled={isLoading}
          containers={containers}
        />

        <TagManager
          tags={track.tags}
          availableTags={['chill', 'energetic', 'focus', 'party', 'workout']}
          onAdd={(tag) => onTagAdd(track.id, tag)}
          onRemove={(tag) => onTagRemove(track.id, tag)}
          disabled={isLoading}
        />
      </Box>
    </Box>
  )
}