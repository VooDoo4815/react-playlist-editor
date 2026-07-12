import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { AudioTrack, CategoryMap } from '../types'
import { movePlaylistTrackLogic } from './movePlaylistTrack'

const DEFAULT_CONTAINERS = ['1 hour', '2 hours', 'break'] as const

export const CONTAINER_COLOR_PALETTE = [
  '#1976d2', '#d32f2f', '#388e3c', '#f57c00',
  '#7b1fa2', '#0097a7', '#fbc02d', '#e64a19',
  '#303f9f', '#689f38', '#00796b', '#c2185b',
]

export function usePlaylistEditor() {
  const [rawTracks, setRawTracks] = useState<AudioTrack[]>([])
  const [playlistOrder, setPlaylistOrder] = useState<string[]>([])
  const [containerGroupsInPlaylist, setContainerGroupsInPlaylist] = useState<string[]>([])
  const [containerOrder, setContainerOrder] = useState<Record<string, string[]>>({})
  const [containerColors, setContainerColors] = useState<Record<string, string>>({})
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 })
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [metadataProgress, setMetadataProgress] = useState({ current: 0, total: 0 })
  const [customContainers, setCustomContainers] = useState<string[]>([])
  const allContainers = useMemo(() => [...DEFAULT_CONTAINERS, ...customContainers], [customContainers])
  const abortControllerRef = useRef<AbortController | null>(null)

  const tracks = useMemo(() => {
    const playlistSet = new Set(playlistOrder)
    return rawTracks.map(t => ({ ...t, addedToPlaylist: playlistSet.has(t.id) }))
  }, [rawTracks, playlistOrder])

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
    const parsed = storedTracks ? JSON.parse(storedTracks) : []
    setRawTracks(parsed.map((t: AudioTrack) => ({ ...t, status: t.status || 'ready', file: null, url: null, fileHandle: undefined } as AudioTrack)))

    const storedOrder = localStorage.getItem('audioPlaylist_order')
    if (storedOrder) {
      setPlaylistOrder(JSON.parse(storedOrder))
    } else {
      const orderedIds = parsed.filter((t: AudioTrack) => t.addedToPlaylist).map((t: AudioTrack) => t.id)
      if (orderedIds.length > 0) setPlaylistOrder(orderedIds)
    }

    const storedGroups = localStorage.getItem('audioPlaylist_containerGroups')
    if (storedGroups) {
      setContainerGroupsInPlaylist(JSON.parse(storedGroups))
    }

    const storedContainerOrder = localStorage.getItem('audioPlaylist_containerOrder')
    if (storedContainerOrder) {
      setContainerOrder(JSON.parse(storedContainerOrder))
    } else if (parsed.length > 0) {
      const order: Record<string, string[]> = {}
      parsed.forEach((t: AudioTrack) => {
        if (t.container) {
          if (!order[t.container]) order[t.container] = []
          order[t.container].push(t.id)
        }
      })
      if (Object.keys(order).length > 0) setContainerOrder(order)
    }

    const storedColors = localStorage.getItem('audioPlaylist_containerColors')
    if (storedColors) {
      setContainerColors(JSON.parse(storedColors))
    }

    const storedCustom = localStorage.getItem('audioPlaylist_customContainers')
    if (storedCustom) {
      setCustomContainers(JSON.parse(storedCustom))
    }
  }, [])

  useEffect(() => {
    const persistTracks = rawTracks.map(({ file, url, fileHandle, ...rest }) => rest)
    localStorage.setItem('audioPlaylist_tracks', JSON.stringify(persistTracks))
    localStorage.setItem('audioPlaylist_order', JSON.stringify(playlistOrder))
    localStorage.setItem('audioPlaylist_containerGroups', JSON.stringify(containerGroupsInPlaylist))
    localStorage.setItem('audioPlaylist_containerOrder', JSON.stringify(containerOrder))
    localStorage.setItem('audioPlaylist_containerColors', JSON.stringify(containerColors))
    localStorage.setItem('audioPlaylist_customContainers', JSON.stringify(customContainers))
  }, [rawTracks, playlistOrder, containerGroupsInPlaylist, containerOrder, containerColors, customContainers])

  useEffect(() => {
    setContainerColors(prev => {
      const next = { ...prev }
      let changed = false
      allContainers.forEach((name, i) => {
        if (!next[name]) {
          next[name] = CONTAINER_COLOR_PALETTE[i % CONTAINER_COLOR_PALETTE.length]
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [allContainers])

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

      setRawTracks(prev => [...prev, ...newTracks])

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

        setRawTracks(prev => prev.map(t =>
          t.id === track.id
            ? { ...t, file, url, duration, status: 'ready' as const }
            : t
        ))
      } catch (err) {
        console.error('Metadata load failed:', track.name, err)
        setRawTracks(prev => prev.map(t =>
          t.id === track.id ? { ...t, status: 'error' as const } : t
        ))
      }
      setMetadataProgress(p => ({ ...p, current: i + 1 }))
    }
    setIsLoadingMetadata(false)
  }, [])

  const updateTrackContainer = useCallback((trackId: string, container: string | null) => {
    const track = rawTracks.find(t => t.id === trackId)
    const oldContainer = track?.container || null

    setRawTracks(prev => prev.map(t => t.id === trackId ? { ...t, container } : t))
    setContainerOrder(prev => {
      const next = { ...prev }
      if (oldContainer && next[oldContainer]) {
        next[oldContainer] = next[oldContainer].filter(id => id !== trackId)
      }
      if (container) {
        if (!next[container]) next[container] = []
        if (!next[container].includes(trackId)) {
          next[container] = [...next[container], trackId]
        }
      }
      return next
    })
  }, [rawTracks])

  const addTrackTag = useCallback((trackId: string, tag: string) => {
    setRawTracks(prev => prev.map(t =>
      t.id === trackId && !t.tags.includes(tag) ? { ...t, tags: [...t.tags, tag] } : t
    ))
  }, [])

  const removeTrackTag = useCallback((trackId: string, tag: string) => {
    setRawTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, tags: t.tags.filter(tg => tg !== tag) } : t
    ))
  }, [])

  const togglePlaylist = useCallback((trackId: string, added: boolean) => {
    setPlaylistOrder(prev => {
      if (added) {
        return prev.includes(trackId) ? prev : [...prev, trackId]
      }
      return prev.filter(id => id !== trackId)
    })
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
    setRawTracks(prev => prev.map(t => t.container === name ? { ...t, container: null } : t))
    setContainerOrder(prev => ({ ...prev, [name]: [] }))
  }, [])

  const containerPlaylistTracks = useMemo(() =>
    playlistOrder.map(id => tracks.find(t => t.id === id)).filter(Boolean) as AudioTrack[],
    [playlistOrder, tracks]
  )

  const toggleContainerGroup = useCallback((name: string) => {
    if (containerGroupsInPlaylist.includes(name)) {
      setContainerGroupsInPlaylist(prev => prev.filter(c => c !== name))
      setPlaylistOrder(prev => prev.filter(id => {
        const t = rawTracks.find(t => t.id === id)
        return !t || t.container !== name
      }))
    } else {
      setContainerGroupsInPlaylist(prev => [...prev, name])
      setPlaylistOrder(prev => {
        const ids = containerOrder[name] || rawTracks.filter(t => t.container === name).map(t => t.id)
        const newIds = ids.filter(id => !prev.includes(id))
        return [...prev, ...newIds]
      })
    }
  }, [containerGroupsInPlaylist, rawTracks, containerOrder])

  const removeContainer = useCallback((name: string) => {
    if (DEFAULT_CONTAINERS.includes(name as typeof DEFAULT_CONTAINERS[number])) {
      clearContainer(name)
      return
    }
    if (!window.confirm(`Delete container "${name}" and remove all tracks from it?`)) return
    setCustomContainers(prev => prev.filter(c => c !== name))
    setRawTracks(prev => prev.map(t => t.container === name ? { ...t, container: null } : t))
    setContainerOrder(prev => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [clearContainer])

  const addContainer = useCallback((name: string, color?: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (allContainers.includes(trimmed)) return
    setCustomContainers(prev => [...prev, trimmed])
    setContainerColors(prev => {
      if (prev[trimmed]) return prev
      const assignedCount = Object.keys(prev).length
      const hex = color || CONTAINER_COLOR_PALETTE[assignedCount % CONTAINER_COLOR_PALETTE.length]
      return { ...prev, [trimmed]: hex }
    })
  }, [allContainers])

  const moveTrack = useCallback((trackId: string, direction: 'up' | 'down', visibleTrackIds: string[]) => {
    const track = rawTracks.find(t => t.id === trackId)
    if (!track || !track.container) return
    setContainerOrder(prev => {
      const order = [...(prev[track.container!] || visibleTrackIds)]
      const idx = order.indexOf(trackId)
      if (idx === -1) return prev
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= order.length) return prev
      ;[order[idx], order[swapIdx]] = [order[swapIdx], order[idx]]
      return { ...prev, [track.container!]: order }
    })
  }, [rawTracks])

  const movePlaylistTrack = useCallback((trackId: string, direction: 'up' | 'down') => {
    setPlaylistOrder(prev => movePlaylistTrackLogic(prev, rawTracks, trackId, direction))
  }, [rawTracks])

  const moveContainerBlock = useCallback((name: string, direction: 'up' | 'down') => {
    setPlaylistOrder(prev => {
      const containerIds = prev.filter(id => {
        const t = rawTracks.find(t => t.id === id)
        return t?.container === name
      })
      if (containerIds.length === 0) return prev

      const blockStart = prev.indexOf(containerIds[0])
      const blockEnd = blockStart + containerIds.length - 1
      const blockLen = containerIds.length

      for (let i = 0; i < containerIds.length; i++) {
        if (prev[blockStart + i] !== containerIds[i]) return prev
      }

      const newOrder = [...prev]

      if (direction === 'up') {
        if (blockStart === 0) return prev
        const prevId = newOrder[blockStart - 1]
        const prevTrack = rawTracks.find(t => t.id === prevId)
        let insertAt: number
        if (prevTrack?.container) {
          let prevBlockStart = blockStart - 1
          while (prevBlockStart > 0 && rawTracks.find(t => t.id === newOrder[prevBlockStart - 1])?.container === prevTrack.container) {
            prevBlockStart--
          }
          insertAt = prevBlockStart
        } else {
          insertAt = blockStart - 1
        }
        newOrder.splice(blockStart, blockLen)
        newOrder.splice(insertAt, 0, ...containerIds)
        return newOrder
      } else {
        if (blockEnd >= newOrder.length - 1) return prev
        const nextId = newOrder[blockEnd + 1]
        const nextTrack = rawTracks.find(t => t.id === nextId)
        let insertAt: number
        if (nextTrack?.container) {
          let nextBlockEnd = blockEnd + 1
          while (nextBlockEnd < newOrder.length - 1 && rawTracks.find(t => t.id === newOrder[nextBlockEnd + 1])?.container === nextTrack.container) {
            nextBlockEnd++
          }
          insertAt = nextBlockEnd + 1
        } else {
          insertAt = blockEnd + 1
        }
        newOrder.splice(blockStart, blockLen)
        if (nextTrack?.container) {
          if (insertAt > blockStart) insertAt -= blockLen
        } else {
          insertAt = blockStart + 1
        }
        newOrder.splice(insertAt, 0, ...containerIds)
        return newOrder
      }
    })
  }, [rawTracks])

  const clearPlaylist = useCallback(() => {
    setPlaylistOrder([])
    setContainerGroupsInPlaylist([])
  }, [])

  const deleteTrack = useCallback((trackId: string) => {
    if (playingTrackId === trackId) {
      cleanupAudio()
      setPlayingTrackId(null)
      setAudioCurrentTime(0)
    }
    if (!window.confirm('Delete this track?')) return
    setRawTracks(prev => prev.filter(t => t.id !== trackId))
    setPlaylistOrder(prev => prev.filter(id => id !== trackId))
    setContainerOrder(prev => {
      const next = { ...prev }
      for (const name of Object.keys(next)) {
        next[name] = next[name].filter(id => id !== trackId)
      }
      return next
    })
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
    clearPlaylist,
    containerGroupsInPlaylist,
    containerPlaylistTracks,
    toggleContainerGroup,
    movePlaylistTrack,
    moveContainerBlock,
    containerOrder,
    containerColors,
  }
}