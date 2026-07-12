import { useState, useCallback, useMemo } from 'react'
import type { AudioTrack } from '../types'
import { movePlaylistTrackLogic } from './movePlaylistTrack'

export function usePlaylistOrder(
  rawTracks: AudioTrack[],
  containerOrder: Record<string, string[]>,
) {
  const [playlistOrder, setPlaylistOrder] = useState<string[]>([])
  const [containerGroupsInPlaylist, setContainerGroupsInPlaylist] = useState<string[]>([])

  const togglePlaylist = useCallback((trackId: string, added: boolean) => {
    setPlaylistOrder(prev => {
      if (added) {
        return prev.includes(trackId) ? prev : [...prev, trackId]
      }
      return prev.filter(id => id !== trackId)
    })
  }, [])

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

  const clearPlaylist = useCallback(() => {
    setPlaylistOrder([])
    setContainerGroupsInPlaylist([])
  }, [])

  const containerPlaylistTracks = useMemo(() =>
    playlistOrder.map(id => rawTracks.find(t => t.id === id)).filter(Boolean) as AudioTrack[],
    [playlistOrder, rawTracks]
  )

  return {
    playlistOrder,
    setPlaylistOrder,
    containerGroupsInPlaylist,
    setContainerGroupsInPlaylist,
    containerPlaylistTracks,
    togglePlaylist,
    movePlaylistTrack,
    moveContainerBlock,
    toggleContainerGroup,
    clearPlaylist,
  }
}
