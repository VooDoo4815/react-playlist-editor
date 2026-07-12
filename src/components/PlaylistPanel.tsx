import { useMemo, useState } from 'react'
import { Card, CardHeader, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material'
import { ExpandMore, ExpandLess, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import type { AudioTrack } from '../types'
import { formatDuration, formatTotalDuration, hexToRgba } from '../utils/format'
import { usePlaylist } from '../contexts/PlaylistContext'
import { TrackItem } from './TrackItem'

type Segment =
  | { type: 'block'; name: string; tracks: AudioTrack[] }
  | { type: 'track'; track: AudioTrack }

interface PlaylistPanelProps {
  tracks: AudioTrack[]
}

export function PlaylistPanel({ tracks }: PlaylistPanelProps) {
  const {
    movePlaylistTrack,
    moveContainerBlock,
    containerColors,
    containerGroupsInPlaylist,
    moveTrack,
  } = usePlaylist()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)

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

    const presentBlocks = new Set(result.filter(s => s.type === 'block').map(s => s.name))
    for (const name of containerGroupsInPlaylist) {
      if (!presentBlocks.has(name)) {
        result.push({ type: 'block', name, tracks: [] })
      }
    }

    return result
  }, [tracks, containerGroupsInPlaylist])

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
        {segments.length === 0 ? (
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
                const visibleIds = seg.tracks.map(t => t.id)
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
                        {moveContainerBlock && (
                          <>
                            <Tooltip title="Move block up">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={segIdx === 0}
                                  onClick={() => moveContainerBlock(seg.name, 'up')}
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
                                  onClick={() => moveContainerBlock(seg.name, 'down')}
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
                      seg.tracks.length === 0 ? (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                          Container is empty
                        </Typography>
                      ) : (
                        <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0, m: 0, listStyle: 'none' }}>
                          {seg.tracks.map((track, tIdx) => (
                            <TrackItem
                              key={track.id}
                              variant="playlist"
                              track={track}
                              folderLabel={track.folder}
                              onMoveUp={tIdx > 0 ? () => moveTrack(track.id, 'up', visibleIds) : undefined}
                              onMoveDown={tIdx < seg.tracks.length - 1 ? () => moveTrack(track.id, 'down', visibleIds) : undefined}
                            />
                          ))}
                        </Box>
                      )
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
                  folderLabel={seg.track.folder}
                  onMoveUp={idx > 0 ? () => movePlaylistTrack(seg.track.id, 'up') : undefined}
                  onMoveDown={idx < tracks.length - 1 ? () => movePlaylistTrack(seg.track.id, 'down') : undefined}
                />
              )
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
