import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import { MdFolder, MdWarning } from 'react-icons/md';
import { useStorage } from '../../context/StorageContext';
import { getBrowserInfo } from '../../types/storage';

export const FolderSelector = () => {
  const { isSupported, selectFolder, status, error } = useStorage();
  const browserInfo = getBrowserInfo();

  const handleSelectFolder = async () => {
    await selectFolder();
  };

  return (
    <Paper
      sx={{
        p: 6,
        textAlign: 'center',
        maxWidth: 500,
        mx: 'auto',
        mt: 8,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: isSupported ? 'primary.50' : 'warning.50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
        }}
      >
        {isSupported ? (
          <MdFolder size={40} color="#1976d2" />
        ) : (
          <MdWarning size={40} color="#ed6c02" />
        )}
      </Box>

      <Typography variant="h5" fontWeight={600} gutterBottom>
        {isSupported ? 'Select Storage Folder' : 'Browser Not Supported'}
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {isSupported
          ? 'Choose a folder on your computer to store your posts, images, projects, and settings. Your data will be saved locally and persist between sessions.'
          : browserInfo.message}
      </Typography>

      {!isSupported && (
        <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body2">
            <strong>Detected browser:</strong> {browserInfo.browser}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            You can still use the app, but content won't be saved between sessions.
            Use the download buttons to save your work manually.
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
          {error}
        </Alert>
      )}

      {isSupported && (
        <Button
          variant="contained"
          size="large"
          startIcon={<MdFolder />}
          onClick={handleSelectFolder}
          disabled={status === 'connecting'}
          sx={{ minWidth: 200 }}
        >
          {status === 'connecting' ? 'Connecting...' : 'Choose Folder'}
        </Button>
      )}

      {isSupported && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
          Your browser will ask for permission to access the folder.
          <br />
          Files will be organized automatically in subfolders.
        </Typography>
      )}
    </Paper>
  );
};
