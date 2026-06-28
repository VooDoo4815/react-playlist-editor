interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  if (total === 0) return null

  const percent = (current / total) * 100

  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
      <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      <span className="progress-bar-text">{current} / {total} tracks analyzed</span>
    </div>
  )
}