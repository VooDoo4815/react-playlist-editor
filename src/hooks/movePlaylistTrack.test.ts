import { describe, it, expect } from 'vitest'
import { movePlaylistTrackLogic } from './movePlaylistTrack'
import type { TrackLike } from './movePlaylistTrack'

function track(id: string, container?: string): TrackLike {
  return { id, container: container ?? null }
}

describe('movePlaylistTrackLogic', () => {
  // --- simple adjacent moves (no containers) ---
  describe('adjacent moves — no containers', () => {
    it('moves middle track up', () => {
      const order = ['A', 'B', 'C']
      const tracks = [track('A'), track('B'), track('C')]
      expect(movePlaylistTrackLogic(order, tracks, 'B', 'up')).toEqual(['B', 'A', 'C'])
    })

    it('moves middle track down', () => {
      const order = ['A', 'B', 'C']
      const tracks = [track('A'), track('B'), track('C')]
      expect(movePlaylistTrackLogic(order, tracks, 'B', 'down')).toEqual(['A', 'C', 'B'])
    })

    it('moves first track down', () => {
      const order = ['A', 'B', 'C']
      const tracks = [track('A'), track('B'), track('C')]
      expect(movePlaylistTrackLogic(order, tracks, 'A', 'down')).toEqual(['B', 'A', 'C'])
    })

    it('moves last track up', () => {
      const order = ['A', 'B', 'C']
      const tracks = [track('A'), track('B'), track('C')]
      expect(movePlaylistTrackLogic(order, tracks, 'C', 'up')).toEqual(['A', 'C', 'B'])
    })
  })

  // --- container block: move within block ---
  describe('within container block', () => {
    it('moves first track in block down', () => {
      const order = ['X1', 'X2', 'X3']
      const tracks = [track('X1', 'X'), track('X2', 'X'), track('X3', 'X')]
      expect(movePlaylistTrackLogic(order, tracks, 'X1', 'down')).toEqual(['X2', 'X1', 'X3'])
    })

    it('moves middle track up', () => {
      const order = ['X1', 'X2', 'X3']
      const tracks = [track('X1', 'X'), track('X2', 'X'), track('X3', 'X')]
      expect(movePlaylistTrackLogic(order, tracks, 'X2', 'up')).toEqual(['X2', 'X1', 'X3'])
    })

    it('moves middle track down', () => {
      const order = ['X1', 'X2', 'X3']
      const tracks = [track('X1', 'X'), track('X2', 'X'), track('X3', 'X')]
      expect(movePlaylistTrackLogic(order, tracks, 'X2', 'down')).toEqual(['X1', 'X3', 'X2'])
    })

    it('moves last track in block up', () => {
      const order = ['X1', 'X2', 'X3']
      const tracks = [track('X1', 'X'), track('X2', 'X'), track('X3', 'X')]
      expect(movePlaylistTrackLogic(order, tracks, 'X3', 'up')).toEqual(['X1', 'X3', 'X2'])
    })

    it('is no-op at block start up', () => {
      const order = ['X1', 'X2', 'X3']
      const tracks = [track('X1', 'X'), track('X2', 'X'), track('X3', 'X')]
      expect(movePlaylistTrackLogic(order, tracks, 'X1', 'up')).toEqual(order)
    })

    it('is no-op at block end down', () => {
      const order = ['X1', 'X2', 'X3']
      const tracks = [track('X1', 'X'), track('X2', 'X'), track('X3', 'X')]
      expect(movePlaylistTrackLogic(order, tracks, 'X3', 'down')).toEqual(order)
    })
  })

  // --- uncategorized track jumping over container blocks ---
  describe('jump over container block (down)', () => {
    it('jumps over block to end', () => {
      const order = ['A', 'X1', 'X2']
      const tracks = [track('A'), track('X1', 'X'), track('X2', 'X')]
      expect(movePlaylistTrackLogic(order, tracks, 'A', 'down')).toEqual(['X1', 'X2', 'A'])
    })

    it('jumps over block — block followed by more uncategorized tracks', () => {
      const order = ['A', 'B', 'X1', 'X2', 'C', 'D']
      const tracks = [track('A'), track('B'), track('X1', 'X'), track('X2', 'X'), track('C'), track('D')]
      const result = movePlaylistTrackLogic(order, tracks, 'B', 'down')
      expect(result).toEqual(['A', 'X1', 'X2', 'B', 'C', 'D'])
    })

    it('jumps over block — exact bug report scenario', () => {
      const order = ['A', 'B', 'X1', 'X2', 'C', 'D']
      const tracks = [track('A'), track('B'), track('X1', 'X'), track('X2', 'X'), track('C'), track('D')]
      const result = movePlaylistTrackLogic(order, tracks, 'B', 'down')
      expect(result).toEqual(['A', 'X1', 'X2', 'B', 'C', 'D'])
    })

    it('jumps over first block when track is at position 0', () => {
      const order = ['A', 'X1', 'X2', 'B']
      const tracks = [track('A'), track('X1', 'X'), track('X2', 'X'), track('B')]
      expect(movePlaylistTrackLogic(order, tracks, 'A', 'down')).toEqual(['X1', 'X2', 'A', 'B'])
    })

    it('jumps over block into the middle (before next uncategorized)', () => {
      const order = ['A', 'X1', 'X2', 'B', 'C']
      const tracks = [track('A'), track('X1', 'X'), track('X2', 'X'), track('B'), track('C')]
      expect(movePlaylistTrackLogic(order, tracks, 'A', 'down')).toEqual(['X1', 'X2', 'A', 'B', 'C'])
    })
  })

  describe('jump over container block (up)', () => {
    it('jumps over block to start', () => {
      const order = ['X1', 'X2', 'A']
      const tracks = [track('X1', 'X'), track('X2', 'X'), track('A')]
      expect(movePlaylistTrackLogic(order, tracks, 'A', 'up')).toEqual(['A', 'X1', 'X2'])
    })

    it('adjacent swap up (not jumping over block)', () => {
      const order = ['A', 'X1', 'X2', 'B', 'C']
      const tracks = [track('A'), track('X1', 'X'), track('X2', 'X'), track('B'), track('C')]
      expect(movePlaylistTrackLogic(order, tracks, 'C', 'up')).toEqual(['A', 'X1', 'X2', 'C', 'B'])
    })

    it('jumps over block — C up over X block, lands before block', () => {
      const order = ['A', 'B', 'X1', 'X2', 'C']
      const tracks = [track('A'), track('B'), track('X1', 'X'), track('X2', 'X'), track('C')]
      expect(movePlaylistTrackLogic(order, tracks, 'C', 'up')).toEqual(['A', 'B', 'C', 'X1', 'X2'])
    })

    it('jumps over block from non-adjacent position up', () => {
      const order = ['A', 'B', 'X1', 'X2', 'C', 'D']
      const tracks = [track('A'), track('B'), track('X1', 'X'), track('X2', 'X'), track('C'), track('D')]
      expect(movePlaylistTrackLogic(order, tracks, 'C', 'up')).toEqual(['A', 'B', 'C', 'X1', 'X2', 'D'])
    })

    it('C up — no jump, adjacent swap with B (no block)', () => {
      const order = ['A', 'B', 'C', 'X1', 'X2']
      const tracks = [track('A'), track('B'), track('C'), track('X1', 'X'), track('X2', 'X')]
      expect(movePlaylistTrackLogic(order, tracks, 'C', 'up')).toEqual(['A', 'C', 'B', 'X1', 'X2'])
    })
  })

  // --- edge cases ---
  describe('edge cases', () => {
    it('returns same order for unknown trackId', () => {
      const order = ['A', 'B']
      const tracks = [track('A'), track('B')]
      expect(movePlaylistTrackLogic(order, tracks, 'Z', 'down')).toBe(order)
    })

    it('preserves identity (same reference) on no-op', () => {
      const order = ['A']
      const tracks = [track('A')]
      expect(movePlaylistTrackLogic(order, tracks, 'A', 'down')).toBe(order)
    })

    it('returns same order for empty array', () => {
      expect(movePlaylistTrackLogic([], [], 'A', 'down')).toEqual([])
    })

    it('does not mutate the original order array', () => {
      const order = ['A', 'B', 'C']
      const tracks = [track('A'), track('B'), track('C')]
      const copy = [...order]
      movePlaylistTrackLogic(order, tracks, 'B', 'up')
      expect(order).toEqual(copy)
    })

    it('is no-op moving up at start', () => {
      const order = ['A', 'B']
      const tracks = [track('A'), track('B')]
      expect(movePlaylistTrackLogic(order, tracks, 'A', 'up')).toEqual(order)
    })

    it('is no-op moving down at end', () => {
      const order = ['A', 'B']
      const tracks = [track('A'), track('B')]
      expect(movePlaylistTrackLogic(order, tracks, 'B', 'down')).toEqual(order)
    })
  })

  // --- multiple blocks ---
  describe('multiple container blocks', () => {
    it('jumps over one block when multiple exist', () => {
      const order = ['X1', 'X2', 'A', 'Y1', 'Y2']
      const tracks = [track('X1', 'X'), track('X2', 'X'), track('A'), track('Y1', 'Y'), track('Y2', 'Y')]
      expect(movePlaylistTrackLogic(order, tracks, 'A', 'down')).toEqual(['X1', 'X2', 'Y1', 'Y2', 'A'])
    })

    it('only jumps over adjacent block, not multiple blocks in one step', () => {
      const order = ['A', 'X1', 'X2', 'Y1', 'Y2', 'B']
      const tracks = [track('A'), track('X1', 'X'), track('X2', 'X'), track('Y1', 'Y'), track('Y2', 'Y'), track('B')]
      expect(movePlaylistTrackLogic(order, tracks, 'A', 'down')).toEqual(['X1', 'X2', 'A', 'Y1', 'Y2', 'B'])
    })

    it('jumps over first block when at start', () => {
      const order = ['A', 'X1', 'X2', 'B', 'Y1', 'Y2']
      const tracks = [track('A'), track('X1', 'X'), track('X2', 'X'), track('B'), track('Y1', 'Y'), track('Y2', 'Y')]
      expect(movePlaylistTrackLogic(order, tracks, 'A', 'down')).toEqual(['X1', 'X2', 'A', 'B', 'Y1', 'Y2'])
    })
  })

  // --- tracks not in order (some tracks only referenced by order) ---
  describe('tracks not present in tracks array are ignored', () => {
    it('works when track is in order but not in tracks array', () => {
      const order = ['A', 'B']
      const tracks = [track('A')]
      expect(movePlaylistTrackLogic(order, tracks, 'B', 'up')).toEqual(order)
    })
  })
})
