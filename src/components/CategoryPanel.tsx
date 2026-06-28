import { Card, CardHeader, CardContent, Typography, Box } from '@mui/material'
import type { Category } from '../types'
import { TrackItem } from './TrackItem'

interface CategoryPanelProps {
  category: Category
  onContainerChange: (id: string, container: string | null) => void
  onTagAdd: (id: string, tag: string) => void
  onTagRemove: (id: string, tag: string) => void
  onPlaylistToggle: (id: string, added: boolean) => void
  onDelete: (id: string) => void
  onPlay?: (track: Category['tracks'][0]) => void
}

export function CategoryPanel({
  category,
  onContainerChange,
  onTagAdd,
  onTagRemove,
  onPlaylistToggle,
  onDelete,
  onPlay,
}: CategoryPanelProps) {
  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 300 }}>
      <CardHeader
        title={category.name}
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
          <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {category.tracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                onContainerChange={onContainerChange}
                onTagAdd={onTagAdd}
                onTagRemove={onTagRemove}
                onPlaylistToggle={onPlaylistToggle}
                onDelete={onDelete}
                onPlay={onPlay}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}