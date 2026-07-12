import type { PlaylistEntry } from '../types'

export function movePlaylistTrackLogic(
  order: PlaylistEntry[],
  trackId: string,
  direction: 'up' | 'down',
): PlaylistEntry[] {
  const idx = order.findIndex(e => e.type === 'track' && e.id === trackId)
  if (idx === -1) return order
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= order.length) return order
  const next = [...order]
  ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
  return next
}
