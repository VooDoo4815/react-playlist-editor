import { useState, useCallback, useRef } from 'react'
import type { AudioTrack } from '../types'

export function useAudioPlayback() {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
  }, [])

  const playTrack = useCallback((track: AudioTrack) => {
    if (!track.url) return

    if (playingTrackId === track.id && audioRef.current) {
      cleanupAudio()
      setPlayingTrackId(null)
      setAudioCurrentTime(0)
      return
    }

    cleanupAudio()

    const audio = new Audio(track.url)
    audioRef.current = audio

    audio.ontimeupdate = () => {
      setAudioCurrentTime(audio.currentTime)
    }

    audio.onended = () => {
      setPlayingTrackId(null)
      setAudioCurrentTime(0)
      audioRef.current = null
    }

    audio.play().catch(() => alert('Could not play audio'))
    setPlayingTrackId(track.id)
    setAudioCurrentTime(0)
  }, [playingTrackId, cleanupAudio])

  const seekTrack = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setAudioCurrentTime(time)
    }
  }, [])

  return {
    playingTrackId,
    audioCurrentTime,
    playTrack,
    seekTrack,
    cleanupAudio,
  }
}
