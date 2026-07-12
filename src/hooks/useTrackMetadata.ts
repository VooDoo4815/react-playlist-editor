import { useState, useCallback, useRef } from 'react'
import type { AudioTrack } from '../types'

export function useTrackMetadata(
  setRawTracks: React.Dispatch<React.SetStateAction<AudioTrack[]>>
) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 })
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [metadataProgress, setMetadataProgress] = useState({ current: 0, total: 0 })
  const abortControllerRef = useRef<AbortController | null>(null)

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
  }, [setRawTracks])

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

      const rootName = dirHandle.name
      const audioEntries: { name: string; handle: FileSystemFileHandle; folder: string }[] = []

      async function walkDirectory(handle: FileSystemDirectoryHandle, prefix: string) {
        for await (const [name, entry] of handle.entries()) {
          if (signal.aborted) return

          if (entry.kind === 'file') {
            if (name.match(/\.(mp3|flac|wav|ogg|m4a|aac)$/i)) {
              audioEntries.push({ name, handle: entry, folder: prefix })
              setScanProgress(p => ({ ...p, total: audioEntries.length }))
            }
          } else if (entry.kind === 'directory') {
            await walkDirectory(entry, `${prefix}/${name}`)
          }
        }
      }

      await walkDirectory(dirHandle, rootName)
      if (signal.aborted) return

      const newTracks: AudioTrack[] = audioEntries.map(entry => ({
        id: Math.random().toString(36).substring(2, 9),
        name: entry.name.replace(/\.[^/.]+$/, ''),
        originalName: entry.name,
        file: null,
        fileHandle: entry.handle,
        url: null,
        duration: null,
        bpm: null,
        folder: entry.folder,
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
  }, [setRawTracks, processMetadataBatch])

  return {
    isScanning,
    scanProgress,
    isLoadingMetadata,
    metadataProgress,
    handlePickFolder,
  }
}
