import { useState, useCallback, useRef } from 'react'
import type { AudioTrack } from '../types'
import { analyze } from 'web-audio-beat-detector'
import type { ITempoSettings } from 'web-audio-beat-detector-worker'

export function useBPMAnalysis(
  setRawTracks: React.Dispatch<React.SetStateAction<AudioTrack[]>>
) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [bpmProgress, setBpmProgress] = useState({ current: 0, total: 0 })
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsAnalyzing(false)
  }, [])

  const analyzeTracks = useCallback(
    async (tracks: AudioTrack[]) => {
      if (tracks.length === 0) return

      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      setIsAnalyzing(true)
      setBpmProgress({ current: 0, total: tracks.length })

      const tempoSettings: ITempoSettings = {
        minTempo: 60,
        maxTempo: 200,
      }

      for (let i = 0; i < tracks.length; i++) {
        if (signal.aborted) break

        const track = tracks[i]
        if (!track.file || track.bpm !== null) {
          setBpmProgress(p => ({ ...p, current: i + 1 }))
          continue
        }

        try {
          const arrayBuffer = await track.file.arrayBuffer()
          const audioContext = new AudioContext()
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
          await audioContext.close()

          const bpm = await analyze(audioBuffer, tempoSettings)

          setRawTracks(prev =>
            prev.map(t =>
              t.id === track.id ? { ...t, bpm } : t
            )
          )
        } catch (err) {
          console.error('BPM analysis failed:', track.name, err)
        }

        setBpmProgress(p => ({ ...p, current: i + 1 }))
      }

      if (!signal.aborted) {
        setIsAnalyzing(false)
      }
    },
    [setRawTracks]
  )

  return {
    analyzeTracks,
    isAnalyzing,
    bpmProgress,
    cancelAnalysis,
  }
}