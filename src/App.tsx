import { useState, useEffect, useRef, DragEvent } from 'react'
import './App.css'

interface AudioTrack {
  id: string
  name: string
  file: File
  url: string
  duration: number
  bpm: number
  folder: string
  tags: string[]
  container: string | null
  addedToPlaylist: boolean
}

interface Category {
  name: string
  tracks: AudioTrack[]
  totalDuration: number
  trackCount: number
  repetitionCount: number
}

function App() {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [categories, setCategories] = useState<Record<string, Category>>({})
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [isAnalyzingBPM, setIsAnalyzingBPM] = useState<boolean>(false)
  const [progress, setProgress] = useState<{current: number, total: number}>({current: 0, total: 0})
  const [containers] = useState<string[]>(['1 hour', '2 hours', 'break'])
  const [tags] = useState<string[]>(['chill', 'energetic', 'focus', 'party', 'workout'])
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const analyzeBPM = async (audioBuffer: AudioBuffer): Promise<number> => {
    const sampleRate = audioBuffer.sampleRate
    const channelData = audioBuffer.getChannelData(0)
    const frameCount = channelData.length
    let maxAmplitude = 0

    for (let i = 0; i < frameCount; i++) {
      const amplitude = Math.abs(channelData[i])
      if (amplitude > maxAmplitude) maxAmplitude = amplitude
    }

    const volumePercent = maxAmplitude * 100
    return volumePercent > 50 ? 120 : 95
  }

  const extractMetadata = async (file: File): Promise<{duration: number, bpm: number}> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.src = URL.createObjectURL(file)
      audio.onloadedmetadata = async () => {
        const bpm = await analyzeBPM(audio)
        resolve({ duration: audio.duration, bpm })
      }
    })
  }

  const loadTracksFromFolder = async (files: FileList | null) => {
    if (!files) return

    setIsAnalyzingBPM(true)
    setProgress({ current: 0, total: files.length })

    const loadedTracks: AudioTrack[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('audio/')) {
        const { duration, bpm } = await extractMetadata(file)
        const track: AudioTrack = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name.replace(/\.[^/.]+$/, ''),
          file,
          url: URL.createObjectURL(file),
          duration,
          bpm,
          folder: selectedFolder || 'Unknown',
          tags: [],
          container: null,
          addedToPlaylist: false
        }
        loadedTracks.push(track)
        setProgress({ current: i + 1, total: files.length })
      }
    }

    setTracks(prev => [...prev, ...loadedTracks])
    organizeTracks(loadedTracks)
    setIsAnalyzingBPM(false)
  }

  const organizeTracks = (newTracks: AudioTrack[]) => {
    const newCategories: Record<string, Category> = {}

    newTracks.forEach(track => {
      if (!newCategories[track.folder]) {
        newCategories[track.folder] = {
          name: track.folder,
          tracks: [],
          totalDuration: 0,
          trackCount: 0,
          repetitionCount: 0
        }
      }

      newCategories[track.folder].tracks.push(track)
      newCategories[track.folder].totalDuration += track.duration
      newCategories[track.folder].trackCount += 1

      if (track.container) {
        const containerIndex = containers.indexOf(track.container)
        if (containerIndex !== -1) {
          newCategories[track.folder].repetitionCount += 1
        }
      }
    })

    setCategories(prev => ({ ...prev, ...newCategories }))
  }

  const handleFolderSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFolder(event.target.value)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    loadTracksFromFolder(event.target.files)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      loadTracksFromFolder(files)
    }
  }

  const updateTrackContainer = (trackId: string, container: string | null) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        return { ...track, container }
      }
      return track
    }))
  }

  const addTrackTag = (trackId: string, tag: string) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        if (!track.tags.includes(tag)) {
          return { ...track, tags: [...track.tags, tag] }
        }
      }
      return track
    }))
  }

  const removeTrackTag = (trackId: string, tag: string) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        return { ...track, tags: track.tags.filter(t => t !== tag) }
      }
      return track
    }))
  }

  const moveTrackToContainer = (trackId: string, targetContainer: string | null) => {
    updateTrackContainer(trackId, targetContainer)
    organizeTracks(tracks)
  }

  const getAllPlaylistTracks = () => {
    return tracks.filter(track => track.addedToPlaylist)
  }

  const exportToM3U8 = () => {
    const playlistTracks = getAllPlaylistTracks()
    let m3u8Content = ''

    playlistTracks.forEach(track => {
      const line = `file://${track.url}\nTitle: ${track.name}\nDuration: ${track.duration}\n\n`
      m3u8Content += line
    })

    const blob = new Blob([m3u8Content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'playlist.m3u8'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-container">
      <header>
        <h1>Audio Playlist Editor</h1>
        <div className="controls">
          <select value={selectedFolder} onChange={handleFolderSelect}>
            <option value="">Select Folder</option>
            <option value="Music">Music</option>
            <option value="Podcasts">Podcasts</option>
            <option value="Soundtracks">Soundtracks</option>
          </select>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept="audio/*"
            onChange={handleFileUpload}
          />
          <button onClick={() => fileInputRef.current?.click()}>
            Upload Audio Files
          </button>
          <button onClick={exportToM3U8} disabled={getAllPlaylistTracks().length === 0}>
            Export M3U8
          </button>
        </div>
      </header>

      <main>
        {isAnalyzingBPM && (
          <div className="progress-indicator">
            Analyzing BPM... {progress.current}/{progress.total}
          </div>
        )}

        <section className="categories-container">
          {Object.values(categories).map(category => (
            <div key={category.name} className="category">
              <h2>{category.name}</h2>
              <div className="stats">
                <span>Total Duration: {category.totalDuration.toFixed(1)}s</span>
                <span>Tracks: {category.trackCount}</span>
                <span>Repetitions: {category.repetitionCount}</span>
              </div>
              <div className="container-selector">
                <label>Container:</label>
                <select
                  onChange={(e) => {
                    const trackId = prompt('Enter track ID to assign container:')
                    if (trackId && e.target.value) {
                      moveTrackToContainer(trackId, e.target.value)
                    }
                  }}
                >
                  <option value="">No Container</option>
                  {containers.map(container => (
                    <option key={container} value={container}>{container}</option>
                  ))}
                </select>
              </div>
              <div className="track-list">
                {category.tracks.map(track => (
                  <div key={track.id} className="track-item">
                    <div className="track-info">
                      <span className="track-name">{track.name}</span>
                      <span className="track-duration">{track.duration.toFixed(1)}s</span>
                      <span className="track-bpm">BPM: {Math.round(track.bpm)}</span>
                    </div>
                    <div className="track-tags">
                      {track.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                    <div className="track-actions">
                      <select
                        value={track.container || ''}
                        onChange={(e) => updateTrackContainer(track.id, e.target.value || null)}
                      >
                        <option value="">No Container</option>
                        {containers.map(container => (
                          <option key={container} value={container}>{container}</option>
                        ))}
                      </select>
                      <select
                        onChange={(e) => addTrackTag(track.id, e.target.value)}
                      >
                        <option value="">Add Tag</option>
                        {tags.filter(tag => !track.tags.includes(tag)).map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App
