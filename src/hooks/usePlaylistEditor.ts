import { useState, useMemo, useCallback } from 'react'
import type { AudioTrack, CategoryMap } from '../types'
import { DEFAULT_CONTAINERS } from '../constants'
import { useAudioPlayback } from './useAudioPlayback'
import { useTrackMetadata } from './useTrackMetadata'
import { usePlaylistPersistence } from './usePlaylistPersistence'
import { useContainers } from './useContainers'
import { usePlaylistOrder } from './usePlaylistOrder'
import { useTrackOps } from './useTrackOps'

export function usePlaylistEditor() {
  const [rawTracks, setRawTracks] = useState<AudioTrack[]>([])

  const {
    playingTrackId,
    audioCurrentTime,
    playTrack,
    seekTrack,
    cleanupAudio,
  } = useAudioPlayback()

  const {
    isScanning,
    scanProgress,
    isLoadingMetadata,
    metadataProgress,
    handlePickFolder,
  } = useTrackMetadata(setRawTracks)

  const {
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
  } = useContainers(rawTracks, setRawTracks)

  const {
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
  } = usePlaylistOrder(rawTracks, containerOrder)

  const {
    addTrackTag,
    removeTrackTag,
    deleteTrack,
    handleExport,
  } = useTrackOps(setRawTracks, setPlaylistOrder, setContainerOrder, playingTrackId, cleanupAudio)

  usePlaylistPersistence({
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
  })

  const handleUpdateTrackContainer = useCallback((id: string, container: string | null) => {
    const track = rawTracks.find(t => t.id === id)
    const oldContainer = track?.container ?? null

    updateTrackContainer(id, container)

    if (oldContainer && containerGroupsInPlaylist.includes(oldContainer) && oldContainer !== container) {
      setPlaylistOrder(prev => prev.filter(tId => tId !== id))
    }

    if (container && containerGroupsInPlaylist.includes(container) && container !== oldContainer) {
      setPlaylistOrder(prev => prev.includes(id) ? prev : [...prev, id])
    }
  }, [rawTracks, updateTrackContainer, containerGroupsInPlaylist, setPlaylistOrder])

  const handleClearContainer = useCallback((name: string) => {
    const trackIds = rawTracks.filter(t => t.container === name).map(t => t.id)
    clearContainer(name)

    if (containerGroupsInPlaylist.includes(name)) {
      setPlaylistOrder(prev => prev.filter(id => !trackIds.includes(id)))
      setContainerGroupsInPlaylist(prev => prev.filter(c => c !== name))
    }
  }, [rawTracks, clearContainer, containerGroupsInPlaylist, setPlaylistOrder, setContainerGroupsInPlaylist])

  const handleRemoveContainer = useCallback((name: string) => {
    const trackIds = rawTracks.filter(t => t.container === name).map(t => t.id)
    removeContainer(name)

    if (containerGroupsInPlaylist.includes(name)) {
      setPlaylistOrder(prev => prev.filter(id => !trackIds.includes(id)))
      setContainerGroupsInPlaylist(prev => prev.filter(c => c !== name))
    }
  }, [rawTracks, removeContainer, containerGroupsInPlaylist, setPlaylistOrder, setContainerGroupsInPlaylist])

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

  return {
    tracks,
    categories,
    isScanning,
    scanProgress,
    isLoadingMetadata,
    metadataProgress,
    handlePickFolder,
    updateTrackContainer: handleUpdateTrackContainer,
    addTrackTag,
    removeTrackTag,
    togglePlaylist,
    deleteTrack,
    playTrack,
    handleExport: () => handleExport(containerPlaylistTracks),
    playingTrackId,
    audioCurrentTime,
    seekTrack,
    allContainers,
    addContainer,
    removeContainer: handleRemoveContainer,
    clearContainer: handleClearContainer,
    clearPlaylist,
    containerGroupsInPlaylist,
    containerPlaylistTracks,
    toggleContainerGroup,
    movePlaylistTrack,
    moveContainerBlock,
    containerOrder,
    containerColors,
    moveTrack,
  }
}