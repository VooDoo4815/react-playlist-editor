import { Box, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { DEFAULT_TAGS } from '../constants'
import { Close } from '@mui/icons-material'

interface TagManagerProps {
  tags: string[]
  availableTags?: readonly string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  disabled?: boolean
}

export function TagManager({ tags, availableTags = DEFAULT_TAGS, onAdd, onRemove, disabled }: TagManagerProps) {
  const addableTags = availableTags.filter((tag) => !tags.includes(tag))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center', minHeight: 32 }}>
      {tags.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          size="small"
          onDelete={() => !disabled && onRemove(tag)}
          deleteIcon={<Close fontSize="small" />}
          variant="outlined"
          disabled={disabled}
          sx={{ '& .MuiChip-deleteIcon': { color: 'inherit' }, opacity: disabled ? 0.5 : 1 }}
        />
      ))}

      {addableTags.length > 0 && !disabled && (
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="tag-select-label">Add tag</InputLabel>
          <Select
            labelId="tag-select-label"
            value=""
            onChange={(e) => {
              if (e.target.value) onAdd(e.target.value)
              e.target.value = ''
            }}
            displayEmpty
          >
            {addableTags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                {tag}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  )
}