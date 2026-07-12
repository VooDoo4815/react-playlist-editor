import { IconButton, Tooltip } from '@mui/material'
import { PlayCircleOutlined, StopCircle } from '@mui/icons-material'
import type { AudioTrack } from '../types'

interface PlayerControlsProps {
  track: AudioTrack
  isPlaying: boolean
  onPlay?: (track: AudioTrack) => void
}

export function PlayerControls({ track, isPlaying, onPlay }: PlayerControlsProps) {
  if (!onPlay || !track.url || track.status === 'loading' || track.status === 'error') return null

  if (isPlaying) {
    return (
      <Tooltip title="Stop">
        <IconButton size="small" onClick={() => onPlay(track)} aria-label={`Stop ${track.name}`}>
          <StopCircle color="primary" />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Tooltip title="Play">
      <IconButton size="small" onClick={() => onPlay(track)} aria-label={`Play ${track.name}`}>
        <PlayCircleOutlined color="primary" />
      </IconButton>
    </Tooltip>
  )
}
