export interface AudioTrack {
  id: string
  name: string
  originalName: string
  file: File | null
  fileHandle?: FileSystemFileHandle
  url: string | null
  duration: number | null
  bpm: number | null
  folder: string
  tags: string[]
  container: string | null
  addedToPlaylist: boolean
  status: 'loading' | 'ready' | 'error'
}

export interface Category {
  name: string
  tracks: AudioTrack[]
  totalDuration: number
  trackCount: number
  repetitionCount: number
}

export type CategoryMap = Record<string, Category>

export interface TrackFilters {
  hideInPlaylist: boolean
  hideContainerized: boolean
  flatList: boolean
  bpmSort: 'none' | 'asc' | 'desc'
}

export type PlaylistEntry =
  | { type: 'track'; id: string }
  | { type: 'container'; name: string }

export const DEFAULT_CONTAINERS = [
  'Intro',
  'Vibing I',
  'Break I',
  'Pre peak',
  'Peak',
  'Break II',
  'Vibing II',
  'Last Hour',
] as const

export type Container = (typeof DEFAULT_CONTAINERS)[number]

export const DEFAULT_TAGS = ['chill', 'energetic', 'focus', 'party', 'workout'] as const
export type Tag = (typeof DEFAULT_TAGS)[number]
