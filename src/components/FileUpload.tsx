import { useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Box, Typography, SvgIcon } from '@mui/material'
import { CloudUpload } from '@mui/icons-material'

interface FileUploadProps {
  onFilesSelected: (files: FileList | null) => void
  disabled?: boolean
}

export function FileUpload({ onFilesSelected, disabled }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFilesSelected(e.target.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const borderColor = disabled ? 'action.disabled' : 'primary.main'
  const bgColor = disabled ? 'action.hover' : 'transparent'
  const hoverBorderColor = disabled ? 'action.disabled' : 'primary.dark'
  const hoverBgColor = disabled ? 'action.hover' : 'action.selected'

  return (
    <Box
      component="label"
      sx={{
        cursor: 'pointer',
        p: 2,
        border: '2px dashed',
        borderColor,
        borderRadius: 2,
        bgcolor: bgColor,
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: hoverBorderColor,
          bgcolor: hoverBgColor,
        },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minWidth: 280,
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      <SvgIcon sx={{ fontSize: 48, color: disabled ? 'text.disabled' : 'primary.main', mb: 1 }}>
        <CloudUpload />
      </SvgIcon>
      <Typography variant="body1" color={disabled ? 'text.disabled' : 'text.primary'} gutterBottom>
        {disabled ? 'Analyzing BPM...' : 'Drag & drop audio files here, or click to browse'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Supports: MP3, FLAC, WAV, OGG, M4A
      </Typography>
    </Box>
  )
}