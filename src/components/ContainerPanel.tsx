import { useState, useMemo } from 'react'
import { Card, CardHeader, CardContent, Typography, Box, Divider, IconButton, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel } from '@mui/material'
import { Add, Delete, Clear } from '@mui/icons-material'
import type { AudioTrack } from '../types'
import { DEFAULT_CONTAINERS } from '../types'
import { TrackItem } from './TrackItem'

interface ContainerPanelProps {
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
  containers: readonly string[]
  onContainerAdd: (name: string) => void
  onContainerRemove: (name: string) => void
  onContainerClear: (name: string) => void
  onMoveTrack: (trackId: string, direction: 'up' | 'down', visibleTrackIds: string[]) => void
  containerGroupsInPlaylist: readonly string[]
  onToggleContainerGroup: (name: string) => void
}

export function ContainerPanel({
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
  onContainerAdd,
  onContainerRemove,
  onContainerClear,
  containerGroupsInPlaylist,
  onMoveTrack,
  onToggleContainerGroup,
}: ContainerPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const tracksByContainer = useMemo(() => {
    const map: Record<string, AudioTrack[]> = {}
    tracks.forEach(t => {
      const key = t.container || ''
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [tracks])

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

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
  const isDefault = (name: string) => DEFAULT_CONTAINERS.includes(name as typeof DEFAULT_CONTAINERS[number])
  const isEmpty = containers.length === 0

  const handleAddSubmit = () => {
    const trimmed = newName.trim()
    if (trimmed) {
      onContainerAdd(trimmed)
      setNewName('')
      setDialogOpen(false)
    }
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 300 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ color: 'inherit' }}>Containers</Typography>
            <Tooltip title="Add container">
              <IconButton size="small" sx={{ color: 'inherit' }} onClick={() => setDialogOpen(true)}>
                <Add />
              </IconButton>
            </Tooltip>
          </Box>
        }
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Container</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Container name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSubmit()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSubmit} disabled={!newName.trim()}>Add</Button>
        </DialogActions>
      </Dialog>

      <CardContent sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {isEmpty ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            No containers. Click + to add one.
          </Typography>
        ) : (
          containers.map((containerName, idx) => {
            const containerTracks = tracksByContainer[containerName] || []
            const groupDuration = containerTracks.reduce((sum, t) => sum + (t.duration || 0), 0)
            const isLast = idx === containers.length - 1
            return (
              <Box key={containerName}>
                {idx > 0 && <Divider sx={{ my: 1.5 }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={containerGroupsInPlaylist.includes(containerName)}
                        onChange={() => onToggleContainerGroup(containerName)}
                        size="small"
                      />
                    }
                    label={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{containerName}</Typography>}
                    sx={{ ml: -0.5 }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Clear container">
                      <IconButton size="small" onClick={() => onContainerClear(containerName)}>
                        <Clear fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!isDefault(containerName) && (
                      <Tooltip title="Delete container">
                        <IconButton size="small" color="error" onClick={() => onContainerRemove(containerName)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                {containerTracks.length === 0 ? (
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                    This container is empty
                  </Typography>
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      🎵 {containerTracks.length} · ⏱ {formatDuration(groupDuration)}
                    </Typography>
                    <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0, m: 0, listStyle: 'none' }}>
                      {containerTracks.map((track, tIndex) => {
                        const visibleIds = containerTracks.map(t => t.id)
                        return (
                          <TrackItem
                            key={track.id}
                            variant="container"
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
                            onMoveUp={tIndex > 0 ? () => onMoveTrack(track.id, 'up', visibleIds) : undefined}
                            onMoveDown={tIndex < containerTracks.length - 1 ? () => onMoveTrack(track.id, 'down', visibleIds) : undefined}
                          />
                        )
                      })}
                    </Box>
                  </>
                )}
              </Box>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
