import { useState, useCallback, useMemo, useEffect } from 'react'
import type { AudioTrack } from '../types'
import { DEFAULT_CONTAINERS, CONTAINER_COLOR_PALETTE } from '../constants'

export function useContainers(
  rawTracks: AudioTrack[],
  setRawTracks: React.Dispatch<React.SetStateAction<AudioTrack[]>>,
) {
  const [containerOrder, setContainerOrder] = useState<Record<string, string[]>>({})
  const [containerColors, setContainerColors] = useState<Record<string, string>>({})
  const [customContainers, setCustomContainers] = useState<string[]>([])
  const allContainers = useMemo(() => [...DEFAULT_CONTAINERS, ...customContainers], [customContainers])

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

  const clearContainer = useCallback((name: string) => {
    setRawTracks(prev => prev.map(t => t.container === name ? { ...t, container: null } : t))
    setContainerOrder(prev => ({ ...prev, [name]: [] }))
  }, [])

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

  return {
    allContainers,
    containerOrder,
    setContainerOrder,
    containerColors,
    setContainerColors,
    customContainers,
    setCustomContainers,
    updateTrackContainer,
    clearContainer,
    removeContainer,
    addContainer,
    moveTrack,
  }
}
