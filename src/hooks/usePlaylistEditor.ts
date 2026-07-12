import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { AudioTrack, CategoryMap } from '../types'

const DEFAULT_CONTAINERS = ['1 hour', '2 hours', 'break'] as const

export function usePlaylistEditor() {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 })
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [metadataProgress, setMetadataProgress] = useState({ current: 0, total: 0 })
  const [customContainers, setCustomContainers] = useState<string[]>([])
  const allContainers = useMemo(() => [...DEFAULT_CONTAINERS, ...customContainers], [customContainers])
  const abortControllerRef = useRef<AbortController | null>(null)

  const categories: CategoryMap = useMemo(() => {
    const map: CategoryMap = {}
    tracks.forEach(track => {
      if (!map[track.folder]) {
        map[track.folder] = { name: track.folder, tracks: [], totalDuration: 0, trackCount: 0, repetitionCount: 0 }
      }
      map[track.folder].tracks.push(track)
      if (track.duration) map[track.folder].totalDuration += track.duration
      map[track.folder].trackCount += 1
      if (track.container && DEFAULT_CONTAINERS.includes(track.container as typeof DEFAULT_CONTAINERS[number])) {
        map[track.folder].repetitionCount += 1
      }
    })
    return map
  }, [tracks])

  useEffect(() => {
    const storedTracks = localStorage.getItem('audioPlaylist_tracks')
    if (storedTracks) {
      const parsed = JSON.parse(storedTracks)
      setTracks(parsed.map((t: AudioTrack) => ({ ...t, status: t.status || 'ready', file: null, url: null, fileHandle: undefined } as AudioTrack)))
    }
  }, [])

  useEffect(() => {
    const persistTracks = tracks.map(({ file, url, fileHandle, ...rest }) => rest)
    localStorage.setItem('audioPlaylist_tracks', JSON.stringify(persistTracks))
  }, [tracks])

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

      setIsScanning(false)
      setIsLoadingMetadata(true)
      setMetadataProgress({ current: 0, total: newTracks.length })

      await processMetadataBatch(newTracks, signal)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('Folder pick failed:', err)
      setIsScanning(false)
    }
  }, [])

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
  }, [])

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

  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
  }, [])

  const playTrack = useCallback((track: AudioTrack) => {
    if (!track.url) return

    if (playingTrackId === track.id && audioRef.current) {
      cleanupAudio()
      setPlayingTrackId(null)
      setAudioCurrentTime(0)
      return
    }

    cleanupAudio()

    const audio = new Audio(track.url)
    audioRef.current = audio

    audio.ontimeupdate = () => {
      setAudioCurrentTime(audio.currentTime)
    }

    audio.onended = () => {
      setPlayingTrackId(null)
      setAudioCurrentTime(0)
      audioRef.current = null
    }

    audio.play().catch(() => alert('Could not play audio'))
    setPlayingTrackId(track.id)
    setAudioCurrentTime(0)
  }, [playingTrackId, cleanupAudio])

  const seekTrack = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setAudioCurrentTime(time)
    }
  }, [])

  const clearContainer = useCallback((name: string) => {
    setTracks(prev => prev.map(t => t.container === name ? { ...t, container: null } : t))
  }, [])

  const [containerGroupsInPlaylist, setContainerGroupsInPlaylist] = useState<string[]>([])

  const containerPlaylistTracks = useMemo(() =>
    tracks.filter(t => t.addedToPlaylist || containerGroupsInPlaylist.includes(t.container || '')),
    [tracks, containerGroupsInPlaylist]
  )

  const toggleContainerGroup = useCallback((name: string) => {
    setContainerGroupsInPlaylist(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }, [])

  const removeContainer = useCallback((name: string) => {
    if (DEFAULT_CONTAINERS.includes(name as typeof DEFAULT_CONTAINERS[number])) {
      clearContainer(name)
      return
    }
    if (!window.confirm(`Delete container "${name}" and remove all tracks from it?`)) return
    setCustomContainers(prev => prev.filter(c => c !== name))
    setTracks(prev => prev.map(t => t.container === name ? { ...t, container: null } : t))
  }, [clearContainer])

  const addContainer = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (allContainers.includes(trimmed)) return
    setCustomContainers(prev => [...prev, trimmed])
  }, [allContainers])

  const moveTrack = useCallback((trackId: string, direction: 'up' | 'down', visibleTrackIds: string[]) => {
    const idx = visibleTrackIds.indexOf(trackId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= visibleTrackIds.length) return
    const swapId = visibleTrackIds[swapIdx]

    setTracks(prev => {
      const trackIdx = prev.findIndex(t => t.id === trackId)
      const swapTrackIdx = prev.findIndex(t => t.id === swapId)
      if (trackIdx === -1 || swapTrackIdx === -1) return prev
      const next = [...prev]
      ;[next[trackIdx], next[swapTrackIdx]] = [next[swapTrackIdx], next[trackIdx]]
      return next
    })
  }, [])

  const deleteTrack = useCallback((trackId: string) => {
    if (playingTrackId === trackId) {
      cleanupAudio()
      setPlayingTrackId(null)
      setAudioCurrentTime(0)
    }
    if (!window.confirm('Delete this track?')) return
    setTracks(prev => prev.filter(t => t.id !== trackId))
  }, [playingTrackId, cleanupAudio])

  const handleExport = useCallback(() => {
    const playlistTracks = containerPlaylistTracks
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
  }, [containerPlaylistTracks])

  return {
    tracks,
    moveTrack,
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
    playingTrackId,
    audioCurrentTime,
    seekTrack,
    allContainers,
    addContainer,
    removeContainer,
    clearContainer,
    containerGroupsInPlaylist,
    containerPlaylistTracks,
    toggleContainerGroup,
  }
}