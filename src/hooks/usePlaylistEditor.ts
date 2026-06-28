import { useState, useEffect, useCallback, useRef } from 'react'
import type { AudioTrack, CategoryMap } from '../types'

const DEFAULT_CONTAINERS = ['1 hour', '2 hours', 'break'] as const

export function usePlaylistEditor() {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [categories, setCategories] = useState<CategoryMap>({})
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 })
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [metadataProgress, setMetadataProgress] = useState({ current: 0, total: 0 })
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const storedTracks = localStorage.getItem('audioPlaylist_tracks')
    const storedCategories = localStorage.getItem('audioPlaylist_categories')
    if (storedTracks) {
      const parsed = JSON.parse(storedTracks)
      setTracks(parsed.map((t: AudioTrack) => ({ ...t, status: t.status || 'ready', file: null, url: null, fileHandle: undefined } as AudioTrack)))
    }
    if (storedCategories) setCategories(JSON.parse(storedCategories))
  }, [])

  useEffect(() => {
    const persistTracks = tracks.map(({ file, url, fileHandle, ...rest }) => rest)
    localStorage.setItem('audioPlaylist_tracks', JSON.stringify(persistTracks))
    localStorage.setItem('audioPlaylist_categories', JSON.stringify(categories))
  }, [tracks, categories])

  const organizeTracks = useCallback((newTracks: AudioTrack[]) => {
    setCategories(prev => {
      const updated = { ...prev }
      newTracks.forEach(track => {
        if (!updated[track.folder]) {
          updated[track.folder] = { name: track.folder, tracks: [], totalDuration: 0, trackCount: 0, repetitionCount: 0 }
        }
        updated[track.folder].tracks.push(track)
        if (track.duration) updated[track.folder].totalDuration += track.duration
        updated[track.folder].trackCount += 1
        if (track.container && DEFAULT_CONTAINERS.includes(track.container as typeof DEFAULT_CONTAINERS[number])) {
          updated[track.folder].repetitionCount += 1
        }
      })
      return updated
    })
  }, [])

  const recalcRepetitionCounts = useCallback(() => {
    setCategories(prev => {
      const updated = { ...prev }
      Object.values(updated).forEach(cat => {
        cat.repetitionCount = cat.tracks.filter(t =>
          t.container && DEFAULT_CONTAINERS.includes(t.container as typeof DEFAULT_CONTAINERS[number])
        ).length
      })
      return updated
    })
  }, [])

  const handlePickFolder = useCallback(async () => {
    const showDirectoryPicker = (window as unknown as { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker
    if (!showDirectoryPicker) {
      alert('Folder picker not supported in this browser. Use Chrome or Edge.')
      return
    }

    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      const dirHandle = await showDirectoryPicker()
      setIsScanning(true)
      setScanProgress({ current: 0, total: 0 })

      const folderName = dirHandle.name
      const audioEntries: { name: string; handle: FileSystemFileHandle }[] = []

      for await (const [name, handle] of dirHandle.entries()) {
        if (signal.aborted) return
        if (handle.kind === 'file' && name.match(/\.(mp3|flac|wav|ogg|m4a|aac)$/i)) {
          audioEntries.push({ name, handle })
          setScanProgress(p => ({ ...p, total: audioEntries.length }))
        }
      }

      const newTracks: AudioTrack[] = audioEntries.map(entry => ({
        id: Math.random().toString(36).substring(2, 9),
        name: entry.name.replace(/\.[^/.]+$/, ''),
        file: null,
        fileHandle: entry.handle,
        url: null,
        duration: null,
        bpm: null,
        folder: folderName,
        tags: [],
        container: null,
        addedToPlaylist: false,
        status: 'loading' as const,
      }))

      setTracks(prev => [...prev, ...newTracks])
      organizeTracks(newTracks)

      setIsScanning(false)
      setIsLoadingMetadata(true)
      setMetadataProgress({ current: 0, total: newTracks.length })

      await processMetadataBatch(newTracks, signal)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('Folder pick failed:', err)
      setIsScanning(false)
    }
  }, [organizeTracks])

  const processMetadataBatch = useCallback(async (tracksToProcess: AudioTrack[], signal: AbortSignal) => {
    for (let i = 0; i < tracksToProcess.length; i++) {
      if (signal.aborted) break

      const track = tracksToProcess[i]
      try {
        const file = await track.fileHandle!.getFile()
        const url = URL.createObjectURL(file)

        const duration = await new Promise<number | null>((resolve) => {
          const audio = new Audio()
          audio.src = url
          audio.onloadedmetadata = () => resolve(audio.duration)
          audio.onerror = () => resolve(null)
        })

        setTracks(prev => prev.map(t =>
          t.id === track.id
            ? { ...t, file, url, duration, status: 'ready' as const }
            : t
        ))
      } catch (err) {
        console.error('Metadata load failed:', track.name, err)
        setTracks(prev => prev.map(t =>
          t.id === track.id ? { ...t, status: 'error' as const } : t
        ))
      }
      setMetadataProgress(p => ({ ...p, current: i + 1 }))
    }
    setIsLoadingMetadata(false)
  }, [])

  const updateTrackContainer = useCallback((trackId: string, container: string | null) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, container } : t))
    setTimeout(recalcRepetitionCounts, 0)
  }, [recalcRepetitionCounts])

  const addTrackTag = useCallback((trackId: string, tag: string) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId && !t.tags.includes(tag) ? { ...t, tags: [...t.tags, tag] } : t
    ))
  }, [])

  const removeTrackTag = useCallback((trackId: string, tag: string) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, tags: t.tags.filter(tg => tg !== tag) } : t
    ))
  }, [])

  const togglePlaylist = useCallback((trackId: string, added: boolean) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, addedToPlaylist: added } : t))
  }, [])

  const deleteTrack = useCallback((trackId: string) => {
    if (!window.confirm('Delete this track?')) return
    setTracks(prev => prev.filter(t => t.id !== trackId))
  }, [])

  const playTrack = useCallback((track: AudioTrack) => {
    if (!track.url) return
    const audio = new Audio(track.url)
    audio.play().catch(() => alert('Could not play audio'))
  }, [])

  const handleExport = useCallback(() => {
    const playlistTracks = tracks.filter(t => t.addedToPlaylist)
    if (playlistTracks.length === 0) return

    let m3u8Content = '#EXTM3U\n'
    playlistTracks.forEach(track => {
      if (track.url) {
        m3u8Content += `#EXTINF:${Math.round(track.duration || 0)},${track.name}\n`
        m3u8Content += `${track.url}\n`
      }
    })

    const blob = new Blob([m3u8Content], { type: 'audio/x-mpegurl; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'playlist.m3u8'
    a.click()
    URL.revokeObjectURL(url)
  }, [tracks])

  return {
    tracks,
    categories,
    isScanning,
    scanProgress,
    isLoadingMetadata,
    metadataProgress,
    handlePickFolder,
    updateTrackContainer,
    addTrackTag,
    removeTrackTag,
    togglePlaylist,
    deleteTrack,
    playTrack,
    handleExport,
  }
}