import { useState, useCallback, useMemo } from 'react'
import type { AudioTrack, PlaylistEntry } from '../types'
import { movePlaylistTrackLogic } from './movePlaylistTrack'

export function usePlaylistOrder(
  rawTracks: AudioTrack[],
  containerOrder: Record<string, string[]>,
) {
  const [playlistOrder, setPlaylistOrder] = useState<PlaylistEntry[]>([])

  const containerGroupsInPlaylist = useMemo(() =>
    playlistOrder.filter(e => e.type === 'container').map(e => e.name),
    [playlistOrder]
  )

  const containerPlaylistTracks = useMemo(() => {
    const result: AudioTrack[] = []
    for (const entry of playlistOrder) {
      if (entry.type === 'track') {
        const track = rawTracks.find(t => t.id === entry.id)
        if (track) result.push(track)
      } else {
        const ids = containerOrder[entry.name] || []
        for (const id of ids) {
          const track = rawTracks.find(t => t.id === id)
          if (track) result.push(track)
        }
      }
    }
    return result
  }, [playlistOrder, rawTracks, containerOrder])

  const togglePlaylist = useCallback((trackId: string, added: boolean) => {
    if (added) {
      setPlaylistOrder(prev =>
        prev.some(e => e.type === 'track' && e.id === trackId)
          ? prev
          : [...prev, { type: 'track', id: trackId }]
      )
    } else {
      setPlaylistOrder(prev =>
        prev.filter(e => !(e.type === 'track' && e.id === trackId))
      )
    }
  }, [])

  const movePlaylistTrack = useCallback((trackId: string, direction: 'up' | 'down') => {
    setPlaylistOrder(prev => movePlaylistTrackLogic(prev, trackId, direction))
  }, [])

  const moveContainerBlock = useCallback((name: string, direction: 'up' | 'down') => {
    setPlaylistOrder(prev => {
      const idx = prev.findIndex(e => e.type === 'container' && e.name === name)
      if (idx === -1) return prev
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }, [])

  const toggleContainerGroup = useCallback((name: string) => {
    setPlaylistOrder(prev => {
      const exists = prev.some(e => e.type === 'container' && e.name === name)
      if (exists) {
        return prev.filter(e => !(e.type === 'container' && e.name === name))
      }
      return [...prev, { type: 'container', name }]
    })
  }, [])

  const clearPlaylist = useCallback(() => {
    setPlaylistOrder([])
  }, [])

  return {
    playlistOrder,
    setPlaylistOrder,
    containerGroupsInPlaylist,
    containerPlaylistTracks,
    togglePlaylist,
    movePlaylistTrack,
    moveContainerBlock,
    toggleContainerGroup,
    clearPlaylist,
  }
}
