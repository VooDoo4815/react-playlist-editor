import { Box, LinearProgress, Typography } from '@mui/material'

interface ProgressIndicatorProps {
  current: number
  total: number
  label?: string
}

export function ProgressIndicator({ current, total, label = 'Analyzing BPM' }: ProgressIndicatorProps) {
  if (current === 0 && total === 0) return null

  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {current} / {total} ({percent}%)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  )
}