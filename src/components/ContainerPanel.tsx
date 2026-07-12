import { useState, useMemo } from 'react'
import { Card, CardHeader, CardContent, Typography, Box, IconButton, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel } from '@mui/material'
import { Add, Delete, Clear, ExpandMore, ExpandLess } from '@mui/icons-material'
import type { AudioTrack } from '../types'
import { CONTAINER_COLOR_PALETTE, DEFAULT_CONTAINERS } from '../constants'
import { formatDuration, formatTotalDuration, hexToRgba } from '../utils/format'
import { usePlaylist } from '../contexts/PlaylistContext'
import { TrackItem } from './TrackItem'

interface ContainerPanelProps {
  tracks: AudioTrack[]
}

export function ContainerPanel({ tracks }: ContainerPanelProps) {
  const {
    allContainers,
    addContainer,
    removeContainer,
    clearContainer,
    moveTrack,
    containerGroupsInPlaylist,
    toggleContainerGroup,
    containerOrder,
    containerColors,
  } = usePlaylist()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const tracksByContainer = useMemo(() => {
    const map: Record<string, AudioTrack[]> = {}
    tracks.forEach(t => {
      const key = t.container || ''
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    for (const key of Object.keys(map)) {
      const order = containerOrder[key]
      if (order) {
        const orderMap = new Map(order.map((id, idx) => [id, idx]))
        map[key].sort((a, b) => {
          const ai = orderMap.get(a.id) ?? Infinity
          const bi = orderMap.get(b.id) ?? Infinity
          return ai - bi
        })
      }
    }
    return map
  }, [tracks, containerOrder])

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
  const isDefault = (name: string) => DEFAULT_CONTAINERS.includes(name as typeof DEFAULT_CONTAINERS[number])
  const isEmpty = allContainers.length === 0

  const handleAddSubmit = () => {
    const trimmed = newName.trim()
    if (trimmed) {
      addContainer(trimmed, selectedColor || undefined)
      setNewName('')
      setSelectedColor(null)
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

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelectedColor(null) }} maxWidth="xs" fullWidth>
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
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 1 }}>
            Color
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {CONTAINER_COLOR_PALETTE.map(color => (
              <Box
                key={color}
                onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: selectedColor === color ? '3px solid' : '2px solid transparent',
                  borderColor: selectedColor === color ? 'text.primary' : 'transparent',
                  transition: 'border-color 0.15s',
                  '&:hover': { opacity: 0.8 },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setSelectedColor(null) }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSubmit} disabled={!newName.trim()}>Add</Button>
        </DialogActions>
      </Dialog>

      <CardContent sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {isEmpty ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            No containers. Click + to add one.
          </Typography>
        ) : (
          allContainers.map((containerName) => {
            const containerTracks = tracksByContainer[containerName] || []
            const groupDuration = containerTracks.reduce((sum, t) => sum + (t.duration || 0), 0)
            const color = containerColors[containerName]
            const bgColor = color ? hexToRgba(color, 0.12) : 'transparent'
            return (
              <Box key={containerName} sx={{ borderRadius: 1.5, backgroundColor: bgColor, p: 1, mx: -1, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <FormControlLabel
                    control={
                      <Checkbox
                        checked={containerGroupsInPlaylist.includes(containerName)}
                        onChange={() => toggleContainerGroup(containerName)}
                        size="small"
                      />
                    }
                    label={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{containerName}</Typography>}
                    sx={{ ml: -0.5 }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => setCollapsed(prev => ({ ...prev, [containerName]: !prev[containerName] }))}>
                      {collapsed[containerName] ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
                    </IconButton>
                    <Tooltip title="Clear container">
                      <IconButton size="small" onClick={() => clearContainer(containerName)}>
                        <Clear fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!isDefault(containerName) && (
                      <Tooltip title="Delete container">
                        <IconButton size="small" color="error" onClick={() => removeContainer(containerName)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                {containerTracks.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    🎵 {containerTracks.length} · ⏱ {formatDuration(groupDuration)}
                  </Typography>
                )}
                {!collapsed[containerName] ? (
                  containerTracks.length === 0 ? (
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                      This container is empty
                    </Typography>
                  ) : (
                    <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0, m: 0, listStyle: 'none' }}>
                      {containerTracks.map((track, tIndex) => {
                        const visibleIds = containerTracks.map(t => t.id)
                        return (
                          <TrackItem
                            key={track.id}
                            variant="container"
                            track={track}
                            folderLabel={track.folder}
                            onMoveUp={tIndex > 0 ? () => moveTrack(track.id, 'up', visibleIds) : undefined}
                            onMoveDown={tIndex < containerTracks.length - 1 ? () => moveTrack(track.id, 'down', visibleIds) : undefined}
                          />
                        )
                      })}
                    </Box>
                  )
                ) : null}
              </Box>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
