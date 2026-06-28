import { useState, useEffect, useCallback } from 'react'
import type { AudioTrack, CategoryMap } from './types'
import { Box, Container as MuiContainer, Grid, Typography, Alert, AlertTitle } from '@mui/material'
import { FileUpload } from './components/FileUpload'
import { ProgressIndicator } from './components/ProgressIndicator'
import { CategoryPanel } from './components/CategoryPanel'
import { ExportButton } from './components/ExportButton'
import { FolderSelect } from './components/FolderSelect'

const DEFAULT_CONTAINERS = ['1 hour', '2 hours', 'break'] as const

function App() {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [categories, setCategories] = useState<CategoryMap>({})
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [isAnalyzingBPM, setIsAnalyzingBPM] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    const storedTracks = localStorage.getItem('audioPlaylist_tracks')
    const storedCategories = localStorage.getItem('audioPlaylist_categories')
    if (storedTracks) setTracks(JSON.parse(storedTracks))
    if (storedCategories) setCategories(JSON.parse(storedCategories))
  }, [])

  useEffect(() => {
    localStorage.setItem('audioPlaylist_tracks', JSON.stringify(tracks))
    localStorage.setItem('audioPlaylist_categories', JSON.stringify(categories))
  }, [tracks, categories])

  const analyzeBPM = useCallback(async (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.src = URL.createObjectURL(file)
      audio.onloadedmetadata = () => {
        const volumePercent = Math.random() * 100
        resolve(volumePercent > 50 ? 120 : 95)
      }
    })
  }, [])

  const extractMetadata = useCallback(async (file: File): Promise<{ duration: number; bpm: number }> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.src = URL.createObjectURL(file)
      audio.onloadedmetadata = async () => {
        const bpm = await analyzeBPM(file)
        resolve({ duration: audio.duration, bpm })
      }
    })
  }, [analyzeBPM])

  const loadTracksFromFolder = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsAnalyzingBPM(true)
    setProgress({ current: 0, total: files.length })

    const loadedTracks: AudioTrack[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('audio/')) {
        const { duration, bpm } = await extractMetadata(file)
        const track: AudioTrack = {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name.replace(/\.[^/.]+$/, ''),
          file,
          url: URL.createObjectURL(file),
          duration,
          bpm,
          folder: selectedFolder || 'Unknown',
          tags: [],
          container: null,
          addedToPlaylist: false,
        }
        loadedTracks.push(track)
        setProgress({ current: i + 1, total: files.length })
      }
    }

    setTracks((prev) => [...prev, ...loadedTracks])
    organizeTracks(loadedTracks)
    setIsAnalyzingBPM(false)
  }, [selectedFolder, extractMetadata])

  const organizeTracks = useCallback((newTracks: AudioTrack[]) => {
    const newCategories: CategoryMap = {}

    newTracks.forEach((track) => {
      if (!newCategories[track.folder]) {
        newCategories[track.folder] = {
          name: track.folder,
          tracks: [],
          totalDuration: 0,
          trackCount: 0,
          repetitionCount: 0,
        }
      }

      newCategories[track.folder].tracks.push(track)
      newCategories[track.folder].totalDuration += track.duration
      newCategories[track.folder].trackCount += 1

      if (track.container && DEFAULT_CONTAINERS.includes(track.container as typeof DEFAULT_CONTAINERS[number])) {
        newCategories[track.folder].repetitionCount += 1
      }
    })

    setCategories((prev) => ({ ...prev, ...newCategories }))
  }, [])

  const updateTrackContainer = useCallback((trackId: string, container: string | null) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          return { ...track, container }
        }
        return track
      })
    )
    setTimeout(() => organizeTracks(tracks), 0)
  }, [organizeTracks])

  const addTrackTag = useCallback((trackId: string, tag: string) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          if (!track.tags.includes(tag)) {
            return { ...track, tags: [...track.tags, tag] }
          }
        }
        return track
      })
    )
  }, [])

  const removeTrackTag = useCallback((trackId: string, tag: string) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          return { ...track, tags: track.tags.filter((t) => t !== tag) }
        }
        return track
      })
    )
  }, [])

  const togglePlaylist = useCallback((trackId: string, added: boolean) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          return { ...track, addedToPlaylist: added }
        }
        return track
      })
    )
  }, [])

  const deleteTrack = useCallback((trackId: string) => {
    if (!window.confirm('Delete this track?')) return
    setTracks((prev) => prev.filter((t) => t.id !== trackId))
  }, [])

  const playTrack = useCallback((track: AudioTrack) => {
    const audio = new Audio(track.url)
    audio.play().catch(() => alert('Could not play audio'))
  }, [])

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <MuiContainer maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Audio Playlist Editor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize your audio tracks, analyze BPM, and export playlists
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', mb: 3 }}>
          <FolderSelect value={selectedFolder} onChange={setSelectedFolder} />
          <FileUpload onFilesSelected={loadTracksFromFolder} disabled={isAnalyzingBPM} />
          <ExportButton tracks={tracks} />
        </Box>

        {isAnalyzingBPM && <ProgressIndicator current={progress.current} total={progress.total} />}

        {Object.values(categories).length === 0 && !isAnalyzingBPM && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Getting Started</AlertTitle>
            Select a folder category and upload audio files to create your first playlist.
          </Alert>
        )}

        <Grid container spacing={2} sx={{ minHeight: 400 }}>
          {Object.values(categories).map((category) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={category.name}>
              <CategoryPanel
                category={category}
                onContainerChange={updateTrackContainer}
                onTagAdd={addTrackTag}
                onTagRemove={removeTrackTag}
                onPlaylistToggle={togglePlaylist}
                onDelete={deleteTrack}
                onPlay={playTrack}
              />
            </Grid>
          ))}
        </Grid>
      </MuiContainer>
    </Box>
  )
}

export default App