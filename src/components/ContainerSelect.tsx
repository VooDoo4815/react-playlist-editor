import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { DEFAULT_CONTAINERS } from '../types'

interface ContainerSelectProps {
  value: string | null
  onChange: (container: string | null) => void
  trackName: string
}

export function ContainerSelect({ value, onChange, trackName }: ContainerSelectProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel id={`container-select-${trackName}`}>Container</InputLabel>
      <Select
        labelId={`container-select-${trackName}`}
        value={value || ''}
        label="Container"
        onChange={(e) => onChange(e.target.value || null)}
        displayEmpty
      >
        <MenuItem value="">— No container —</MenuItem>
        {DEFAULT_CONTAINERS.map((container) => (
          <MenuItem key={container} value={container}>
            {container}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}