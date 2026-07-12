import { useState, useMemo } from 'react'
import type { AudioTrack, CategoryMap, TrackFilters } from '../types'
import { DEFAULT_CONTAINERS } from '../types'
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
    isAnalyzingBPM,
    bpmProgress,
    handlePickFolder,
    cancelBPMAnalysis,
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
    containerOrder,
    setContainerOrder,
    containerColors,
    setContainerColors,
    customContainers,
    setCustomContainers,
  })

  const tracks = useMemo(() => {
    const playlistSet = new Set(playlistOrder.filter(e => e.type === 'track').map(e => e.id))
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

  const [trackFilters, setTrackFilters] = useState<TrackFilters>({
    hideInPlaylist: false,
    hideContainerized: false,
    flatList: false,
    bpmSort: 'none',
  })

  const filteredCategories: CategoryMap = useMemo(() => {
    const map: CategoryMap = {}
    for (const [name, cat] of Object.entries(categories)) {
      const filtered = cat.tracks.filter(t => {
        if (trackFilters.hideInPlaylist && t.addedToPlaylist) return false

        return !(trackFilters.hideContainerized && t.container != null);

      })
      if (filtered.length === 0) continue
      const totalDuration = filtered.reduce((sum, t) => sum + (t.duration || 0), 0)
      const repetitionCount = filtered.filter(t =>
        t.container && DEFAULT_CONTAINERS.includes(t.container as typeof DEFAULT_CONTAINERS[number])
      ).length
      map[name] = { name, tracks: filtered, totalDuration, trackCount: filtered.length, repetitionCount }
    }
    return map
  }, [categories, trackFilters])

  const flatTracks = useMemo(() => {
    const allTracks = Object.values(filteredCategories).flatMap(c => c.tracks)
    if (trackFilters.bpmSort === 'none') return allTracks
    return [...allTracks].sort((a, b) => {
      if (a.bpm === null && b.bpm === null) return 0
      if (a.bpm === null) return 1
      if (b.bpm === null) return -1
      return trackFilters.bpmSort === 'asc' ? a.bpm - b.bpm : b.bpm - a.bpm
    })
  }, [filteredCategories, trackFilters.bpmSort])

  return {
    tracks,
    categories,
    filteredCategories,
    flatTracks,
    playlistOrder,
    trackFilters,
    setTrackFilters,
    isScanning,
    scanProgress,
    isLoadingMetadata,
    metadataProgress,
    isAnalyzingBPM,
    bpmProgress,
    handlePickFolder,
    cancelBPMAnalysis,
    updateTrackContainer,
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
    moveTrack,
  }
}
