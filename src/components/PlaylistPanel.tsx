import { useMemo, useState } from 'react'
import { Card, CardHeader, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material'
import { ExpandMore, ExpandLess, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import type { AudioTrack } from '../types'
import { TrackItem } from './TrackItem'

type Segment =
  | { type: 'block'; name: string; tracks: AudioTrack[] }
  | { type: 'track'; track: AudioTrack }

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
  onMovePlaylistTrack: (trackId: string, direction: 'up' | 'down') => void
  onMoveContainerBlock?: (name: string, direction: 'up' | 'down') => void
  containerColors?: Record<string, string>
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
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
  onMovePlaylistTrack,
  onMoveContainerBlock,
  containerColors = {},
}: PlaylistPanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)

  const formatDuration = (seconds: number | null) => {
    if (seconds == null) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const segments = useMemo(() => {
    const result: Segment[] = []
    let currentBlock: (Segment & { type: 'block' }) | null = null

    tracks.forEach(t => {
      if (t.container) {
        if (currentBlock && currentBlock.name === t.container) {
          currentBlock.tracks.push(t)
        } else {
          if (currentBlock) result.push(currentBlock)
          currentBlock = { type: 'block', name: t.container, tracks: [t] }
        }
      } else {
        if (currentBlock) {
          result.push(currentBlock)
          currentBlock = null
        }
        result.push({ type: 'track', track: t })
      }
    })
    if (currentBlock) result.push(currentBlock)

    return result
  }, [tracks])

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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {segments.map((seg, segIdx) => {
              if (seg.type === 'block') {
                const groupDuration = seg.tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
                const color = containerColors[seg.name]
                const bgColor = color ? hexToRgba(color, 0.12) : 'transparent'
                const isCollapsed = collapsed[seg.name]
                return (
                  <Box key={seg.name} sx={{ borderRadius: 1.5, backgroundColor: bgColor, p: 1, mx: -0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, px: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => setCollapsed(prev => ({ ...prev, [seg.name]: !prev[seg.name] }))}>
                          {isCollapsed ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
                        </IconButton>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {seg.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          🎵 {seg.tracks.length} · ⏱ {formatDuration(groupDuration)}
                        </Typography>
                        {onMoveContainerBlock && (
                          <>
                            <Tooltip title="Move block up">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={segIdx === 0}
                                  onClick={() => onMoveContainerBlock(seg.name, 'up')}
                                >
                                  <ArrowUpward fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move block down">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={segIdx === segments.length - 1}
                                  onClick={() => onMoveContainerBlock(seg.name, 'down')}
                                >
                                  <ArrowDownward fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>
                    {!isCollapsed && (
                      <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0, m: 0, listStyle: 'none' }}>
                        {seg.tracks.map((track, tIdx) => (
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
                            onMoveUp={tIdx > 0 ? () => onMovePlaylistTrack(track.id, 'up') : undefined}
                            onMoveDown={tIdx < seg.tracks.length - 1 ? () => onMovePlaylistTrack(track.id, 'down') : undefined}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )
              }
              const idx = tracks.indexOf(seg.track)
              return (
                <TrackItem
                  key={seg.track.id}
                  variant="playlist"
                  track={seg.track}
                  onContainerChange={onContainerChange}
                  onTagAdd={onTagAdd}
                  onTagRemove={onTagRemove}
                  onPlaylistToggle={onPlaylistToggle}
                  onDelete={onDelete}
                  onPlay={onPlay}
                  playingTrackId={playingTrackId}
                  audioCurrentTime={audioCurrentTime}
                  onSeek={onSeek}
                  folderLabel={seg.track.folder}
                  containers={containers}
                  onMoveUp={idx > 0 ? () => onMovePlaylistTrack(seg.track.id, 'up') : undefined}
                  onMoveDown={idx < tracks.length - 1 ? () => onMovePlaylistTrack(seg.track.id, 'down') : undefined}
                />
              )
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
