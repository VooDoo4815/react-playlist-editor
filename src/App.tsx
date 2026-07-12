import { Box, Container as MuiContainer, Grid, Typography, Alert, AlertTitle, Button, Tooltip, FormControlLabel, Switch } from '@mui/material'
import { FolderOpen, Download, Clear } from '@mui/icons-material'
import { CategoryPanel } from './components/CategoryPanel'
import { ContainerPanel } from './components/ContainerPanel'
import { PlaylistPanel } from './components/PlaylistPanel'
import { ProgressIndicator } from './components/ProgressIndicator'
import { PlaylistProvider } from './contexts/PlaylistContext'
import { usePlaylistEditor } from './hooks/usePlaylistEditor'

function App() {
  const ctx = usePlaylistEditor()

  const {
    tracks,
    categories,
    filteredCategories,
    trackFilters,
    setTrackFilters,
    isScanning,
    isLoadingMetadata,
    isAnalyzingBPM,
    scanProgress,
    metadataProgress,
    bpmProgress,
    handlePickFolder,
    handleExport,
    containerPlaylistTracks,
    allContainers,
    clearPlaylist,
  } = ctx

  const containerTracks = tracks.filter(t => t.container != null)
  const showProgress = isScanning || isLoadingMetadata
  const progressLabel = isScanning ? 'Scanning folder...' : 'Loading track metadata...'
  const progressCurrent = isScanning ? scanProgress.current : metadataProgress.current
  const progressTotal = isScanning ? scanProgress.total : metadataProgress.total

  return (
    <PlaylistProvider value={ctx}>
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
                disabled={isScanning || isLoadingMetadata || isAnalyzingBPM}
                size="large"
              >
                Choose Folder
              </Button>
            </Tooltip>

            <Tooltip title={`Export ${containerPlaylistTracks.length} tracks to M3U8`}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleExport}
                disabled={containerPlaylistTracks.length === 0}
                size="large"
              >
                Export M3U8 ({containerPlaylistTracks.length})
              </Button>
            </Tooltip>
            <Tooltip title="Remove all tracks from playlist">
              <Button
                variant="outlined"
                color="error"
                startIcon={<Clear />}
                onClick={clearPlaylist}
                disabled={containerPlaylistTracks.length === 0}
                size="large"
              >
                Clear Playlist
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

          {isAnalyzingBPM && (
            <ProgressIndicator
              current={bpmProgress.current}
              total={bpmProgress.total}
              label="Analyzing BPM..."
            />
          )}

          {Object.values(categories).length === 0 && !showProgress && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Getting Started</AlertTitle>
              Click "Choose Folder" to select a folder containing audio files.
            </Alert>
          )}

          {Object.values(categories).length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={<Switch checked={trackFilters.hideInPlaylist} onChange={(_, v) => setTrackFilters(prev => ({ ...prev, hideInPlaylist: v }))} />}
                label="Hide in playlist"
              />
              <FormControlLabel
                control={<Switch checked={trackFilters.hideContainerized} onChange={(_, v) => setTrackFilters(prev => ({ ...prev, hideContainerized: v }))} />}
                label="Hide in container"
              />
            </Box>
          )}

          <Grid container spacing={2} sx={{ minHeight: 400 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.values(filteredCategories).map(category => (
                  <CategoryPanel key={category.name} category={category} />
                ))}
              </Box>
            </Grid>
            {allContainers.length > 0 && (
              <Grid size={{ xs: 12, md: 4 }}>
                <ContainerPanel tracks={containerTracks} />
              </Grid>
            )}
            {containerPlaylistTracks.length > 0 && (
              <Grid size={{ xs: 12, md: 4 }}>
                <PlaylistPanel tracks={containerPlaylistTracks} />
              </Grid>
            )}
          </Grid>
        </MuiContainer>
      </Box>
    </PlaylistProvider>
  )
}

export default App