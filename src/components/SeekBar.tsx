import { Box, Slider, Typography } from '@mui/material'
import { formatDuration } from '../utils/format'

interface SeekBarProps {
  duration: number | null
  currentTime: number
  isPlaying: boolean
  onSeek?: (time: number) => void
}

export function SeekBar({ duration, currentTime, isPlaying, onSeek }: SeekBarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 28,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, textAlign: 'right' }}>
        {isPlaying ? formatDuration(currentTime) : null}
      </Typography>
      <Slider
        size="small"
        value={isPlaying ? currentTime : undefined}
        min={0}
        max={duration || 0}
        step={0.1}
        onChange={(_, value) => onSeek?.(value as number)}
        sx={{ flex: 1, py: 0 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
        {formatDuration(duration)}
      </Typography>
    </Box>
  )
}
