import { IconButton, Tooltip } from '@mui/material'
import { RemoveCircleOutlined } from '@mui/icons-material'
import type { AudioTrack } from '../types'
import { usePlaylist } from '../contexts/PlaylistContext'
import { CategoryTrackItem } from './CategoryTrackItem'
import { PlaylistTrackItem } from './PlaylistTrackItem'

interface TrackItemProps {
  track: AudioTrack
  folderLabel?: string
  variant?: 'category' | 'playlist' | 'container'
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export function TrackItem({
  track,
  folderLabel,
  variant = 'category',
  onMoveUp,
  onMoveDown,
}: TrackItemProps) {
  const ctx = usePlaylist()
  const isLoading = track.status === 'loading'

  if (variant === 'playlist') {
    return (
      <PlaylistTrackItem
        track={track}
        folderLabel={folderLabel}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        actionButton={
          <Tooltip title="Remove from playlist">
            <IconButton
              size="small"
              onClick={() => ctx.togglePlaylist(track.id, false)}
              aria-label={`Remove ${track.name} from playlist`}
              disabled={isLoading}
            >
              <RemoveCircleOutlined color="action" />
            </IconButton>
          </Tooltip>
        }
      />
    )
  }

  if (variant === 'container') {
    return (
      <PlaylistTrackItem
        track={track}
        folderLabel={folderLabel}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        actionButton={
          <Tooltip title="Remove from container">
            <IconButton
              size="small"
              onClick={() => ctx.updateTrackContainer(track.id, null)}
              aria-label={`Remove ${track.name} from container`}
              disabled={isLoading}
            >
              <RemoveCircleOutlined color="action" />
            </IconButton>
          </Tooltip>
        }
      />
    )
  }

  return (
    <CategoryTrackItem
      track={track}
      folderLabel={folderLabel}
    />
  )
}