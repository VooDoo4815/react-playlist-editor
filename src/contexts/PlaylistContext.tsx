import { createContext, useContext, type ReactNode } from 'react'
import type { AudioTrack, CategoryMap } from '../types'

interface PlaylistContextValue {
  tracks: AudioTrack[]
  categories: CategoryMap
  isScanning: boolean
  scanProgress: { current: number; total: number }
  isLoadingMetadata: boolean
  metadataProgress: { current: number; total: number }
  handlePickFolder: () => Promise<void>
  updateTrackContainer: (id: string, container: string | null) => void
  addTrackTag: (id: string, tag: string) => void
  removeTrackTag: (id: string, tag: string) => void
  togglePlaylist: (id: string, added: boolean) => void
  deleteTrack: (id: string) => void
  playTrack: (track: AudioTrack) => void
  handleExport: () => void
  playingTrackId: string | null
  audioCurrentTime: number
  seekTrack: (time: number) => void
  allContainers: readonly string[]
  addContainer: (name: string, color?: string) => void
  removeContainer: (name: string) => void
  clearContainer: (name: string) => void
  clearPlaylist: () => void
  containerGroupsInPlaylist: readonly string[]
  containerPlaylistTracks: AudioTrack[]
  toggleContainerGroup: (name: string) => void
  movePlaylistTrack: (id: string, direction: 'up' | 'down') => void
  moveContainerBlock: (name: string, direction: 'up' | 'down') => void
  containerOrder: Record<string, string[]>
  containerColors: Record<string, string>
  moveTrack: (id: string, direction: 'up' | 'down', visibleTrackIds: string[]) => void
}

const PlaylistContext = createContext<PlaylistContextValue | null>(null)

export function usePlaylist(): PlaylistContextValue {
  const ctx = useContext(PlaylistContext)
  if (!ctx) throw new Error('usePlaylist must be used within PlaylistProvider')
  return ctx
}

interface PlaylistProviderProps {
  value: PlaylistContextValue
  children: ReactNode
}

export function PlaylistProvider({ value, children }: PlaylistProviderProps) {
  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  )
}
