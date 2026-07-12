import { useCallback } from 'react'
import type { AudioTrack } from '../types'

export function useTrackOps(
  setRawTracks: React.Dispatch<React.SetStateAction<AudioTrack[]>>,
  setPlaylistOrder: React.Dispatch<React.SetStateAction<string[]>>,
  setContainerOrder: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
  playingTrackId: string | null,
  cleanupAudio: () => void,
) {
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

  const deleteTrack = useCallback((trackId: string) => {
    if (playingTrackId === trackId) {
      cleanupAudio()
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

  const handleExport = useCallback((tracks: AudioTrack[]) => {
    if (tracks.length === 0) return

    let m3u8Content = '#EXTM3U\n'
    tracks.forEach(track => {
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
  }, [])

  return {
    addTrackTag,
    removeTrackTag,
    deleteTrack,
    handleExport,
  }
}
