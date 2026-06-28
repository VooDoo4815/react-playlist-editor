import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { DEFAULT_CONTAINERS } from '../types'

interface ContainerSelectProps {
  value: string | null
  onChange: (container: string | null) => void
  trackName: string
  disabled?: boolean
}

export function ContainerSelect({ value, onChange, trackName, disabled }: ContainerSelectProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 160 }} disabled={disabled}>
      <InputLabel id={`container-select-${trackName}`}>Container</InputLabel>
      <Select
        labelId={`container-select-${trackName}`}
        value={value || ''}
        label="Container"
        onChange={(e) => !disabled && onChange(e.target.value || null)}
        displayEmpty
        disabled={disabled}
      >
        <MenuItem value="">— No container —</MenuItem>
        {DEFAULT_CONTAINERS.map((container) => (
          <MenuItem key={container} value={container} disabled={disabled}>
            {container}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}