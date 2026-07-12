export type TrackLike = { id: string; container: string | null }

export function movePlaylistTrackLogic(
  order: string[],
  tracks: TrackLike[],
  trackId: string,
  direction: 'up' | 'down',
): string[] {
  const idx = order.indexOf(trackId)
  if (idx === -1) return order

  const track = tracks.find(t => t.id === trackId)
  if (!track) return order

  const newOrder = [...order]
  const inBlock = (id: string, container: string) => {
    const t = tracks.find(t => t.id === id)
    return t && t.container === container
  }

  if (track.container) {
    let blockStart = idx
    let blockEnd = idx
    while (blockStart > 0 && inBlock(newOrder[blockStart - 1], track.container)) blockStart--
    while (blockEnd < newOrder.length - 1 && inBlock(newOrder[blockEnd + 1], track.container)) blockEnd++

    const blockIds = newOrder.slice(blockStart, blockEnd + 1)
    const relativeIdx = blockIds.indexOf(trackId)
    const swapRelativeIdx = direction === 'up' ? relativeIdx - 1 : relativeIdx + 1
    if (swapRelativeIdx < 0 || swapRelativeIdx >= blockIds.length) return order

    const swapIdx = blockStart + swapRelativeIdx
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    return newOrder
  } else {
    let targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= newOrder.length) return order

    const targetId = newOrder[targetIdx]
    const targetTrack = tracks.find(t => t.id === targetId)

    if (targetTrack && targetTrack.container) {
      let blockStart = targetIdx
      let blockEnd = targetIdx
      while (blockStart > 0 && inBlock(newOrder[blockStart - 1], targetTrack.container)) blockStart--
      while (blockEnd < newOrder.length - 1 && inBlock(newOrder[blockEnd + 1], targetTrack.container)) blockEnd++

      if (direction === 'up') {
        targetIdx = blockStart
        if (targetIdx < 0) targetIdx = 0
      } else {
        targetIdx = blockEnd + 1
        if (targetIdx > newOrder.length) targetIdx = newOrder.length
      }
      if (idx < targetIdx) targetIdx--
    }

    newOrder.splice(idx, 1)
    newOrder.splice(targetIdx, 0, trackId)
    return newOrder
  }
}
