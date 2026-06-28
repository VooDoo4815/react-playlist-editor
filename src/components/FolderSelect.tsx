import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

interface FolderSelectProps {
  value: string
  onChange: (folder: string) => void
  options?: string[]
}

export function FolderSelect({ value, onChange, options = ['Music', 'Podcasts', 'Soundtracks'] }: FolderSelectProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel id="folder-select-label">Folder</InputLabel>
      <Select
        labelId="folder-select-label"
        value={value}
        label="Folder"
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value="">— Select folder —</MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}