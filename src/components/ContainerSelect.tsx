import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { DEFAULT_CONTAINERS } from '../types'

interface ContainerSelectProps {
  value: string | null
  onChange: (container: string | null) => void
  trackName: string
  disabled?: boolean
  containers?: readonly string[]
}

export function ContainerSelect({ value, onChange, trackName, disabled, containers }: ContainerSelectProps) {
  const options = containers || DEFAULT_CONTAINERS
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
        {options.map((container) => (
          <MenuItem key={container} value={container} disabled={disabled}>
            {container}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}