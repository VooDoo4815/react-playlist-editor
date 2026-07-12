import { Card, CardHeader, CardContent, Typography, Box } from '@mui/material'
import type { AudioTrack } from '../types'
import { TrackItem } from './TrackItem'

interface PlaylistPanelProps {
  tracks: AudioTrack[]
  onContainerChange: (id: string, container: string | null) => void
  onTagAdd: (id: string, tag: string) => void
  onTagRemove: (id: string, tag: string) => void
  onPlaylistToggle: (id: string, added: boolean) => void
  onDelete: (id: string) => void
  onPlay?: (track: AudioTrack) => void
  playingTrackId?: string | null
  audioCurrentTime?: number
  onSeek?: (time: number) => void
  containers?: readonly string[]
  onMoveTrack: (trackId: string, direction: 'up' | 'down', visibleTrackIds: string[]) => void
}

export function PlaylistPanel({
  tracks,
  onContainerChange,
  onTagAdd,
  onTagRemove,
  onPlaylistToggle,
  onDelete,
  onPlay,
  playingTrackId,
  audioCurrentTime,
  onSeek,
  containers,
  onMoveTrack,
}: PlaylistPanelProps) {
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 300 }}>
      <CardHeader
        title="Final Playlist"
        sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText', '& .MuiCardHeader-subheader': { color: 'primary.contrastText', opacity: 0.85 } }}
        subheader={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.85 }}>
              🎵 {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.85 }}>
              ⏱ {formatTotalDuration(totalDuration)}
            </Typography>
          </Box>
        }
      />
      <CardContent sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {tracks.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            No tracks in playlist
          </Typography>
        ) : (
          <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0, m: 0, listStyle: 'none' }}>
            {tracks.map((track, index) => {
              const visibleTrackIds = tracks.map(t => t.id)
              return (
                <TrackItem
                  key={track.id}
                  variant="playlist"
                  track={track}
                  onContainerChange={onContainerChange}
                  onTagAdd={onTagAdd}
                  onTagRemove={onTagRemove}
                  onPlaylistToggle={onPlaylistToggle}
                  onDelete={onDelete}
                  onPlay={onPlay}
                  playingTrackId={playingTrackId}
                  audioCurrentTime={audioCurrentTime}
                  onSeek={onSeek}
                  folderLabel={track.folder}
                  containers={containers}
                  onMoveUp={index > 0 ? () => onMoveTrack(track.id, 'up', visibleTrackIds) : undefined}
                  onMoveDown={index < tracks.length - 1 ? () => onMoveTrack(track.id, 'down', visibleTrackIds) : undefined}
                />
              )
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
