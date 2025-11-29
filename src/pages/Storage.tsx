import { Box, Typography } from '@mui/material';
import { useStorage } from '../context/StorageContext';
import { FolderSelector, StorageStatus, FileBrowser } from '../components/Storage';

const Storage = () => {
  const { status, isSupported } = useStorage();

  const isConnected = status === 'connected';
  const showFolderSelector = !isConnected;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Storage
      </Typography>

      {isConnected && (
        <Box sx={{ mb: 3 }}>
          <StorageStatus variant="detailed" showActions />
        </Box>
      )}

      {showFolderSelector ? (
        <FolderSelector />
      ) : (
        <FileBrowser />
      )}

      {!isSupported && status !== 'connected' && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Without local storage, your work will only persist during this session.
            <br />
            Use the download buttons in each tool to save your content manually.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Storage;
