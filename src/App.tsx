import { Box, Container as MuiContainer, Grid, Typography, Alert, AlertTitle, Button, Tooltip } from '@mui/material'
import { FolderOpen, Download } from '@mui/icons-material'
import { CategoryPanel } from './components/CategoryPanel'
import { ProgressIndicator } from './components/ProgressIndicator'
import { usePlaylistEditor } from './hooks/usePlaylistEditor'

function App() {
  const {
    tracks,
    categories,
    isScanning,
    scanProgress,
    isLoadingMetadata,
    metadataProgress,
    handlePickFolder,
    updateTrackContainer,
    addTrackTag,
    removeTrackTag,
    togglePlaylist,
    deleteTrack,
    playTrack,
    handleExport,
  } = usePlaylistEditor()

  const showProgress = isScanning || isLoadingMetadata
  const progressLabel = isScanning ? 'Scanning folder...' : 'Loading track metadata...'
  const progressCurrent = isScanning ? scanProgress.current : metadataProgress.current
  const progressTotal = isScanning ? scanProgress.total : metadataProgress.total

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <MuiContainer maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Audio Playlist Editor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pick a folder to load audio tracks
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 3 }}>
          <Tooltip title="Choose folder from disk">
            <Button
              variant="contained"
              startIcon={<FolderOpen />}
              onClick={handlePickFolder}
              disabled={isScanning || isLoadingMetadata}
              size="large"
            >
              Choose Folder
            </Button>
          </Tooltip>

          <Tooltip title={`Export ${tracks.filter(t => t.addedToPlaylist).length} tracks to M3U8`}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={tracks.filter(t => t.addedToPlaylist).length === 0}
              size="large"
            >
              Export M3U8 ({tracks.filter(t => t.addedToPlaylist).length})
            </Button>
          </Tooltip>
        </Box>

        {showProgress && (
          <ProgressIndicator
            current={progressCurrent}
            total={progressTotal}
            label={progressLabel}
          />
        )}

        {Object.values(categories).length === 0 && !showProgress && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Getting Started</AlertTitle>
            Click "Choose Folder" to select a folder containing audio files.
          </Alert>
        )}

        <Grid container spacing={2} sx={{ minHeight: 400 }}>
          {Object.values(categories).map(category => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={category.name}>
              <CategoryPanel
                category={category}
                onContainerChange={updateTrackContainer}
                onTagAdd={addTrackTag}
                onTagRemove={removeTrackTag}
                onPlaylistToggle={togglePlaylist}
                onDelete={deleteTrack}
                onPlay={playTrack}
              />
            </Grid>
          ))}
        </Grid>
      </MuiContainer>
    </Box>
  )
}

export default App