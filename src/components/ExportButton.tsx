import { Button, Tooltip } from '@mui/material'
import { Download } from '@mui/icons-material'
import type { AudioTrack } from '../types'

interface ExportButtonProps {
  tracks: AudioTrack[]
  disabled?: boolean
}

export function ExportButton({ tracks, disabled }: ExportButtonProps) {
  const playlistTracks = tracks.filter((t) => t.addedToPlaylist)

  const handleExport = () => {
    if (playlistTracks.length === 0) return

    let m3u8Content = '#EXTM3U\n'

    playlistTracks.forEach((track) => {
      m3u8Content += `#EXTINF:${Math.round(track.duration)},${track.name}\n`
      m3u8Content += `${track.url}\n`
    })

    const blob = new Blob([m3u8Content], { type: 'audio/x-mpegurl; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'playlist.m3u8'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Tooltip title={`Export ${playlistTracks.length} tracks to M3U8`}>
      <Button
        variant="contained"
        startIcon={<Download />}
        onClick={handleExport}
        disabled={disabled || playlistTracks.length === 0}
        size="small"
      >
        Export M3U8 ({playlistTracks.length})
      </Button>
    </Tooltip>
  )
}