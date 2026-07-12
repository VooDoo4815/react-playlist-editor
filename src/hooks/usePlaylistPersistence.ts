import { useEffect } from 'react'
import type { AudioTrack } from '../types'

interface PersistenceState {
  rawTracks: AudioTrack[]
  setRawTracks: React.Dispatch<React.SetStateAction<AudioTrack[]>>
  playlistOrder: string[]
  setPlaylistOrder: React.Dispatch<React.SetStateAction<string[]>>
  containerGroupsInPlaylist: string[]
  setContainerGroupsInPlaylist: React.Dispatch<React.SetStateAction<string[]>>
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
  containerGroupsInPlaylist,
  setContainerGroupsInPlaylist,
  containerOrder,
  setContainerOrder,
  containerColors,
  setContainerColors,
  customContainers,
  setCustomContainers,
}: PersistenceState) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
}
