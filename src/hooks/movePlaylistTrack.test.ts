import { describe, it, expect } from 'vitest'
import { movePlaylistTrackLogic } from './movePlaylistTrack'
import type { PlaylistEntry } from '../types'

describe('movePlaylistTrackLogic', () => {
  it('swaps track entry with neighbor above', () => {
    const order: PlaylistEntry[] = [
      { type: 'track', id: 'A' },
      { type: 'track', id: 'B' },
    ]
    expect(movePlaylistTrackLogic(order, 'B', 'up')).toEqual([
      { type: 'track', id: 'B' },
      { type: 'track', id: 'A' },
    ])
  })

  it('swaps track entry with neighbor below', () => {
    const order: PlaylistEntry[] = [
      { type: 'track', id: 'A' },
      { type: 'track', id: 'B' },
    ]
    expect(movePlaylistTrackLogic(order, 'A', 'down')).toEqual([
      { type: 'track', id: 'B' },
      { type: 'track', id: 'A' },
    ])
  })

  it('is no-op at start moving up', () => {
    const order: PlaylistEntry[] = [
      { type: 'track', id: 'A' },
      { type: 'track', id: 'B' },
    ]
    expect(movePlaylistTrackLogic(order, 'A', 'up')).toBe(order)
  })

  it('is no-op at end moving down', () => {
    const order: PlaylistEntry[] = [
      { type: 'track', id: 'A' },
      { type: 'track', id: 'B' },
    ]
    expect(movePlaylistTrackLogic(order, 'B', 'down')).toBe(order)
  })

  it('returns same array for unknown trackId', () => {
    const order: PlaylistEntry[] = [
      { type: 'track', id: 'A' },
    ]
    expect(movePlaylistTrackLogic(order, 'Z', 'down')).toBe(order)
  })

  it('does not mutate original array', () => {
    const order: PlaylistEntry[] = [
      { type: 'track', id: 'A' },
      { type: 'track', id: 'B' },
    ]
    const copy = [...order]
    movePlaylistTrackLogic(order, 'B', 'up')
    expect(order).toEqual(copy)
  })
})
