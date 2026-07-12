import { useEffect } from 'react'
import type { AudioTrack, PlaylistEntry } from '../types'

interface PersistenceState {
  rawTracks: AudioTrack[]
  setRawTracks: React.Dispatch<React.SetStateAction<AudioTrack[]>>
  playlistOrder: PlaylistEntry[]
  setPlaylistOrder: React.Dispatch<React.SetStateAction<PlaylistEntry[]>>
  containerOrder: Record<string, string[]>
  setContainerOrder: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
  containerColors: Record<string, string>
  setContainerColors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  customContainers: string[]
  setCustomContainers: React.Dispatch<React.SetStateAction<string[]>>
}

export function usePlaylistPersistence({
  rawTracks,
  setRawTracks,
  playlistOrder,
  setPlaylistOrder,
  containerOrder,
  setContainerOrder,
  containerColors,
  setContainerColors,
  customContainers,
  setCustomContainers,
}: PersistenceState) {
  useEffect(() => {
    const storedTracks = localStorage.getItem('audioPlaylist_tracks');
    const parsed = storedTracks ? JSON.parse(storedTracks) as AudioTrack[] : [];

    setRawTracks(parsed.map((t: AudioTrack) => ({ ...t, status: t.status || 'ready', file: null, url: null, fileHandle: undefined } as AudioTrack)));

    const storedOrder = localStorage.getItem('audioPlaylist_order')
    if (storedOrder) {
      const parsedOrder = JSON.parse(storedOrder)
      if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
        if (typeof parsedOrder[0] === 'string') {
          const ids = new Set(parsedOrder as string[])
          const trackIds = parsed.filter((t: AudioTrack) => ids.has(t.id)).map((t: AudioTrack) => t.id)
          const containerNames = parsed
            .filter((t: AudioTrack) => t.container && ids.has(t.id))
            .map((t: AudioTrack) => t.container!)
          const entries: PlaylistEntry[] = []
          const addedContainers = new Set<string>()
          for (const id of ids) {
            if (trackIds.includes(id)) {
              entries.push({ type: 'track', id })
            }
          }
          for (const name of [...new Set(containerNames)]) {
            if (!addedContainers.has(name)) {
              entries.push({ type: 'container', name })
              addedContainers.add(name)
            }
          }
          setPlaylistOrder(entries)
        } else {
          setPlaylistOrder(parsedOrder)
        }
      }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const persistTracks = rawTracks.map(({ file, url, fileHandle, ...rest }) => rest)
    localStorage.setItem('audioPlaylist_tracks', JSON.stringify(persistTracks))
    localStorage.setItem('audioPlaylist_order', JSON.stringify(playlistOrder))
    localStorage.setItem('audioPlaylist_containerOrder', JSON.stringify(containerOrder))
    localStorage.setItem('audioPlaylist_containerColors', JSON.stringify(containerColors))
    localStorage.setItem('audioPlaylist_customContainers', JSON.stringify(customContainers))
  }, [rawTracks, playlistOrder, containerOrder, containerColors, customContainers])
}
