import { Card, CardHeader, CardContent, Typography, Box } from '@mui/material'
import type { Category } from '../types'
import { TrackItem } from './TrackItem'
import { formatTotalDuration } from '../utils/format'

interface CategoryPanelProps {
  category: Category
}

function FolderLabel({ path }: { path: string }) {
  const parts = path.split('/')
  const name = parts[parts.length - 1]
  const parent = parts.length > 1 ? parts.slice(0, -1).join(' / ') : null

  return (
    <Box>
      {parent && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
          {parent}
        </Typography>
      )}
      <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
        {name}
      </Typography>
    </Box>
  )
}

export function CategoryPanel({ category }: CategoryPanelProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 300 }}>
      <CardHeader
        title={<FolderLabel path={category.name} />}
        subheader={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              🎵 {category.trackCount} tracks
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ⏱ {formatTotalDuration(category.totalDuration)}
            </Typography>
            {category.repetitionCount > 0 && (
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500 }}>
                🔁 {category.repetitionCount} in container
              </Typography>
            )}
          </Box>
        }
      />
      <CardContent sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {category.tracks.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            No tracks in this category
          </Typography>
        ) : (
          <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0, m: 0, listStyle: 'none' }}>
            {category.tracks.map((track) => (
              <TrackItem key={track.id} track={track} />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}